import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { startAnalysisTimeout, stopAnalysisTimeout } from '@/lib/analysis-timeout';
import { sendProgressUpdate } from '../analysis-progress/route';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface ComprehensiveBusinessData {
  business_name: string;
  business_description?: string;
  business_summary?: string;
  mission_statement?: string;
  target_audience?: string;
  unique_selling_points?: string[];
  price_range?: string;
  key_features?: string[];
  promotional_content?: string[];
  return_policy?: string | object;
  customer_service_details?: string | object;
  international_shipping?: string | object;
  products?: string[];
  product_categories?: string[];
  shipping_info?: {
    has_free_shipping: boolean;
    free_shipping_conditions?: string;
    shipping_thresholds?: string;
    regional_shipping_notes?: string;
    shipping_incentives?: string;
    general_shipping_policy?: string;
    raw_shipping_snippets?: string[];
  };
  shipping_incentives?: Array<{
    policy: string;
    free_shipping_tier: string;
    threshold_amount?: string;
    delivery_timeframe?: string;
  }>;
}

interface Competitor {
  name: string;
  website: string;
  products: string;
  comprehensiveData?: ComprehensiveBusinessData;
  threshold?: number | null;
}

// Simplified Firecrawl v1 analysis - using same method for all sites
async function comprehensiveFirecrawlAnalysis(websiteUrl: string): Promise<ComprehensiveBusinessData | null> {
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  
  if (!firecrawlApiKey) {
    throw new Error('Firecrawl API key not available');
  }

  try {
    console.log(`Firecrawl v1: Analyzing ${websiteUrl}...`);

    // Ensure URL has protocol
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl;
    }

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: websiteUrl,
        formats: ["extract"],
        waitFor: 3000,
        onlyMainContent: false,
        extract: {
          prompt: `Extract comprehensive business intelligence and shipping information from this website:

**SHIPPING INFORMATION:**
- Detect any form of free or discounted shipping, even if the phrase "free shipping" is not explicitly used.
- Identify conditions under which free or reduced-cost shipping is offered (e.g., minimum order amounts, regional restrictions, promotional periods, membership tiers, or specific product eligibility).
- Include any notes about regional shipping limits (e.g., continental U.S. only, no Alaska/Hawaii, domestic only).
- Pull any general shipping policy or FAQ that mentions delivery rules, timing, or restrictions.
- Include the exact phrases or snippets of text where shipping terms are mentioned.

**BUSINESS INTELLIGENCE:**
- Mission statement, company values, or "about us" information
- Target audience or customer segments they serve
- Unique selling points, competitive advantages, or key differentiators
- Product categories, main offerings, and key features
- Price ranges for products (if visible)
- Current promotions, sales, or special offers
- Return policy details and conditions
- Customer service information (hours, contact methods, support details)
- International shipping policies or restrictions
- Company description and business summary

Search all parts of the website, including homepage banners, promotional sections, footers, policy pages, FAQs, about us, cart/checkout modals, and pop-ups.`,
          schema: {
            type: "object",
            properties: {
              shipping_info: {
                type: "object",
                properties: {
                  has_free_shipping: { type: "boolean" },
                  free_shipping_conditions: { type: "string" },
                  shipping_thresholds: { type: "string" },
                  regional_shipping_notes: { type: "string" },
                  shipping_incentives: { type: "string" },
                  general_shipping_policy: { type: "string" },
                  raw_shipping_snippets: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["has_free_shipping", "general_shipping_policy"]
              },
              business_description: { type: "string" },
              business_summary: { type: "string" },
              business_name: { type: "string" },
              mission_statement: { type: "string" },
              target_audience: { type: "string" },
              unique_selling_points: {
                type: "array",
                items: { type: "string" }
              },
              price_range: { type: "string" },
              key_features: {
                type: "array",
                items: { type: "string" }
              },
              promotional_content: {
                type: "array",
                items: { type: "string" }
              },
              return_policy: { type: "string" },
              customer_service_details: { type: "string" },
              international_shipping: { type: "string" },
              products: {
                type: "array",
                items: { type: "string" }
              },
              product_categories: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["shipping_info", "business_description", "business_summary"]
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl v1 failed for ${websiteUrl}: ${response.status} ${response.statusText}`);
      console.error(`Error response body:`, errorText);
      return null;
    }

    let scrapeData;
    let responseText;
    try {
      responseText = await response.text();
      scrapeData = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`Failed to parse Firecrawl response for ${websiteUrl}:`, parseError);
      console.error(`Response was not valid JSON. First 500 characters:`, responseText?.substring(0, 500) || 'No response text');
      return null;
    }

    if (!scrapeData.success) {
      console.error(`Firecrawl v1 failed for ${websiteUrl}:`, scrapeData.error);
      return null;
    }

    const extractedData = scrapeData.data?.extract || null;
    
    // Debug logging for new schema structure
    if (websiteUrl.includes('heirloomjerky') || websiteUrl.includes('jacklinks')) {
      console.log(`\n=== NEW SCHEMA EXTRACTION DEBUG for ${websiteUrl} ===`);
      console.log('Shipping Info:', JSON.stringify(extractedData?.shipping_info, null, 2));
      console.log('Business Name:', extractedData?.business_name);
      console.log('Business Description:', extractedData?.business_description);
      console.log('Business Summary:', extractedData?.business_summary);
      console.log('=== END DEBUG ===\n');
    }

    // Process shipping info with AI to create structured shipping incentives
    if (extractedData?.shipping_info) {
      const shippingInfo = extractedData.shipping_info;
      
      // Combine all shipping text sources
      const allShippingText = [
        shippingInfo.free_shipping_conditions || '',
        shippingInfo.shipping_thresholds || '',
        shippingInfo.shipping_incentives || '',
        shippingInfo.general_shipping_policy || '',
        ...(shippingInfo.raw_shipping_snippets || [])
      ].filter(text => text && text.trim().length > 0).join(' | ');

      if (allShippingText && allShippingText.trim().length > 0) {
        try {
          console.log(`Processing new schema shipping text for ${websiteUrl}:`, allShippingText.substring(0, 200) + '...');
          
          const shippingAnalysis = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are an expert at analyzing shipping policies. Given shipping information from a website, extract structured data for the PRIMARY shipping policy."
              },
              {
                role: "user", 
                content: `Analyze this shipping information and extract the PRIMARY shipping policy:

Has Free Shipping: ${shippingInfo.has_free_shipping}
Conditions: ${shippingInfo.free_shipping_conditions || 'N/A'}
Thresholds: ${shippingInfo.shipping_thresholds || 'N/A'}
Regional Notes: ${shippingInfo.regional_shipping_notes || 'N/A'}
Incentives: ${shippingInfo.shipping_incentives || 'N/A'}
General Policy: ${shippingInfo.general_shipping_policy || 'N/A'}
Raw Snippets: ${shippingInfo.raw_shipping_snippets?.join(' | ') || 'N/A'}

Return JSON with this structure:
{
  "shipping_incentives": [
    {
      "policy": "exact text of primary shipping policy",
      "free_shipping_tier": "when free shipping applies",
      "threshold_amount": "dollar amount or '0' for completely free or 'N/A' for calculated",
      "delivery_timeframe": "delivery time if mentioned"
    }
  ]
}

Focus on the most prominent shipping offer.`
              }
            ],
            response_format: { type: "json_object" }
          });

          let shippingData;
          try {
            shippingData = JSON.parse(shippingAnalysis.choices[0].message.content || '{}');
          } catch (parseError) {
            console.error('Failed to parse OpenAI shipping analysis response:', parseError);
            console.error('OpenAI response content:', shippingAnalysis.choices[0].message.content);
            shippingData = { shipping_incentives: [] };
          }
          
          if (websiteUrl.includes('heirloomjerky') || websiteUrl.includes('jacklinks')) {
            console.log('NEW SCHEMA AI SHIPPING ANALYSIS:', JSON.stringify(shippingData, null, 2));
          }
          
          // Add the AI-processed shipping incentives to the extracted data
          if (shippingData.shipping_incentives) {
            extractedData.shipping_incentives = shippingData.shipping_incentives;
          }
          
        } catch (error) {
          console.error('Error processing new schema shipping text with AI:', error);
          // Fallback: create basic shipping incentive
          if (shippingInfo.has_free_shipping) {
            extractedData.shipping_incentives = [{
              policy: shippingInfo.general_shipping_policy || "Free shipping available",
              free_shipping_tier: shippingInfo.free_shipping_conditions || "Based on policy",
              threshold_amount: "0",
              delivery_timeframe: "Not specified"
            }];
          }
        }
      } else {
        console.log(`WARNING: No shipping text found in new schema for ${websiteUrl}`);
        
        // Check if has_free_shipping is true but no details
        if (shippingInfo.has_free_shipping) {
          extractedData.shipping_incentives = [{
            policy: "Free shipping available",
            free_shipping_tier: "Details not specified",
            threshold_amount: "N/A",
            delivery_timeframe: "Not specified"
          }];
        }
      }
    } else {
      console.log(`WARNING: No shipping_info found in extraction for ${websiteUrl}`);
    }

    return extractedData;
  } catch (error) {
    console.error(`Firecrawl v1 error for ${websiteUrl}:`, error);
    return null;
  }
}

// Verify if a URL is accessible
async function verifyUrlAccessible(url: string): Promise<boolean> {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(fullUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // Try with www prefix if original failed
    try {
      const wwwUrl = url.startsWith('www.') ? url : `www.${url}`;
      const fullWwwUrl = wwwUrl.startsWith('http') ? wwwUrl : `https://${wwwUrl}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(fullWwwUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (secondError) {
      console.log(`URL verification failed for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
}

// Discover competitors using OpenAI with enhanced context and verification
async function discoverCompetitorsWithOpenAI(websiteUrl: string, primaryData: ComprehensiveBusinessData | null): Promise<Competitor[]> {
  const businessContext = primaryData ? `
    Primary Business: ${primaryData.business_name || 'N/A'}
    Website: ${websiteUrl}
    Description: ${primaryData.business_description || 'N/A'}
    Products: ${primaryData.products?.join(', ') || 'N/A'}
    Product Categories: ${primaryData.product_categories?.join(', ') || 'N/A'}
    Target Audience: ${primaryData.target_audience || 'N/A'}
    Mission: ${primaryData.mission_statement || 'N/A'}
  ` : `Website: ${websiteUrl}`;

  const prompt = `Based on this detailed business information:
${businessContext}

Identify exactly 15 direct competitors in the same industry/market (we'll verify and select the best 10). Focus on businesses that:
1. Sell similar products or services to the primary business
2. Target similar customer segments and demographics
3. Operate in similar market segments or price ranges
4. Are legitimate, established businesses with active websites
5. Are direct competitors, not suppliers or complementary businesses

IMPORTANT for website URLs:
- Provide the most accurate, complete domain name you know
- If you know the exact domain (like "fieldtripsnacks.com" not "fieldtrip.com"), use that
- Double-check brand names vs domain names (many brands have different domains)
- Include common domain variations when uncertain
- Be specific about full domain names, not generic terms

Provide response in this exact JSON format:
{
  "competitors": [
    {
      "name": "Exact Company Name",
      "website": "exactdomain.com", 
      "products": "Specific description of their main products that compete with the primary business",
      "confidence": "high|medium|low - your confidence in the domain accuracy"
    }
  ]
}

Include only the domain (no https://, no www) for website field. Focus on accuracy over speed.`;

  try {
    console.log('🔍 Discovering competitors with enhanced context...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.1
    });

    let result;
    try {
      result = JSON.parse(response.choices[0].message.content || '{}');
    } catch (parseError) {
      console.error('Failed to parse OpenAI competitor discovery response:', parseError);
      console.error('OpenAI response content:', response.choices[0].message.content);
      throw new Error('Competitor discovery failed: Invalid response format from AI service');
    }
    const initialCompetitors = result.competitors || [];
    
    console.log(`📋 OpenAI suggested ${initialCompetitors.length} competitors, now verifying URLs...`);
    
    // Verify URLs and filter to working competitors
    const verifiedCompetitors: Competitor[] = [];
    const failedUrls: string[] = [];
    
    for (const competitor of initialCompetitors) {
      console.log(`🔗 Verifying ${competitor.name} (${competitor.website})...`);
      
      const isAccessible = await verifyUrlAccessible(competitor.website);
      
      if (isAccessible) {
        verifiedCompetitors.push({
          name: competitor.name,
          website: competitor.website,
          products: competitor.products
        });
        console.log(`✅ ${competitor.name} URL verified`);
      } else {
        console.log(`❌ ${competitor.name} URL failed verification: ${competitor.website}`);
        failedUrls.push(`${competitor.name} (${competitor.website})`);
      }
      
      // Stop once we have 10 verified competitors
      if (verifiedCompetitors.length >= 10) {
        break;
      }
    }
    
    // If we don't have enough verified competitors, get more suggestions
    if (verifiedCompetitors.length < 10) {
      console.log(`⚠️ Only ${verifiedCompetitors.length}/10 competitors verified. Getting additional suggestions...`);
      
      const additionalPrompt = `The following competitor URLs failed verification: ${failedUrls.join(', ')}
      
Based on the same business context:
${businessContext}

Suggest 10 additional direct competitors with different, verified domain names. Avoid the failed URLs and focus on:
1. Well-established competitors with active websites
2. Alternative competitors in the same market space
3. Both large and smaller niche players
4. Regional or specialized competitors

Use the same JSON format with accurate domains.`;

      try {
        const additionalResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: additionalPrompt }],
          response_format: { type: "json_object" },
          max_tokens: 2000,  
          temperature: 0.2
        });

        let additionalResult;
        try {
          additionalResult = JSON.parse(additionalResponse.choices[0].message.content || '{}');
        } catch (parseError) {
          console.error('Failed to parse additional competitors response:', parseError);
          console.error('OpenAI additional response content:', additionalResponse.choices[0].message.content);
          additionalResult = { competitors: [] };
        }
        const additionalCompetitors = additionalResult.competitors || [];
        
        // Verify additional competitors
        for (const competitor of additionalCompetitors) {
          if (verifiedCompetitors.length >= 10) break;
          
          console.log(`🔗 Verifying additional competitor ${competitor.name} (${competitor.website})...`);
          const isAccessible = await verifyUrlAccessible(competitor.website);
          
          if (isAccessible) {
            verifiedCompetitors.push({
              name: competitor.name,
              website: competitor.website,
              products: competitor.products
            });
            console.log(`✅ ${competitor.name} additional URL verified`);
          }
        }
      } catch (error) {
        console.error('Error getting additional competitors:', error);
      }
    }
    
    console.log(`🎯 Final verified competitors: ${verifiedCompetitors.length}/10`);
    return verifiedCompetitors.slice(0, 10); // Ensure we don't exceed 10
    
  } catch (error) {
    console.error('Error discovering competitors:', error);
    return [];
  }
}

// Extract shipping threshold from business data
function extractShippingThreshold(data: ComprehensiveBusinessData | null): number | null {
  if (!data?.shipping_incentives?.length) return null;
  
  for (const incentive of data.shipping_incentives) {
    if (incentive.threshold_amount && incentive.threshold_amount !== 'N/A') {
      const match = incentive.threshold_amount.match(/\$?(\d+(?:\.\d{2})?)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }
  }
  
  return 0; // Free shipping
}

// Enhance business data with OpenAI analysis
async function enhanceBusinessIntelligence(
  websiteUrl: string, 
  existingData: ComprehensiveBusinessData | null,
  competitorName: string
): Promise<ComprehensiveBusinessData | null> {
  if (!existingData) return null;

  try {
    const prompt = `Based on your knowledge of ${competitorName} (${websiteUrl}) and this existing data:
${JSON.stringify(existingData, null, 2)}

Enhance this business intelligence with additional insights. Fill in missing information about:
- Mission statement or company values (if not provided)
- Target audience and customer segments
- Unique selling points and competitive advantages
- Typical price range for their products
- Key features or benefits they emphasize
- Return policy details (if not extracted)
- Customer service approach or contact methods
- International shipping capabilities

Provide response in this JSON format:
{
  "mission_statement": "Enhanced or original mission statement",
  "target_audience": "Detailed target audience description",
  "unique_selling_points": ["selling point 1", "selling point 2", "selling point 3"],
  "price_range": "Typical price range for products",
  "key_features": ["feature 1", "feature 2", "feature 3"],
  "return_policy": "Return policy details",
  "customer_service_details": "Customer service information",
  "international_shipping": "International shipping policies",
  "promotional_content": ["promotion 1", "promotion 2"]
}

Only include fields where you have confident knowledge. If uncertain about any field, omit it.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.1
    });

    let enhancedData;
    try {
      enhancedData = JSON.parse(response.choices[0].message.content || '{}');
    } catch (parseError) {
      console.error(`Failed to parse OpenAI enhancement response for ${competitorName}:`, parseError);
      console.error('OpenAI response content:', response.choices[0].message.content);
      enhancedData = {};
    }
    
    // Merge enhanced data with existing data
    const mergedData: ComprehensiveBusinessData = {
      ...existingData,
      mission_statement: enhancedData.mission_statement || existingData.mission_statement,
      target_audience: enhancedData.target_audience || existingData.target_audience,
      unique_selling_points: enhancedData.unique_selling_points || existingData.unique_selling_points,
      price_range: enhancedData.price_range || existingData.price_range,
      key_features: enhancedData.key_features || existingData.key_features,
      promotional_content: enhancedData.promotional_content || existingData.promotional_content,
      return_policy: enhancedData.return_policy || existingData.return_policy,
      customer_service_details: enhancedData.customer_service_details || existingData.customer_service_details,
      international_shipping: enhancedData.international_shipping || existingData.international_shipping
    };

    console.log(`✓ Enhanced business intelligence for ${competitorName}`);
    return mergedData;
  } catch (error) {
    console.error(`Failed to enhance business intelligence for ${competitorName}:`, error);
    return existingData;
  }
}

// Generate comprehensive business analysis
async function generateBusinessAnalysis(primaryData: ComprehensiveBusinessData | null, competitors: any[], websiteUrl: string): Promise<string> {
  const competitorContext = competitors.map(comp => `
${comp.name} (${comp.website}):
- Products: ${comp.products}
- Business Name: ${comp.comprehensiveData?.business_name || 'Not available'}
- Description: ${comp.comprehensiveData?.business_description || 'Not available'}
- Mission: ${comp.comprehensiveData?.mission_statement || 'Not available'}
- Target Audience: ${comp.comprehensiveData?.target_audience || 'Not available'}
- Price Range: ${comp.comprehensiveData?.price_range || 'Not available'}
- Key Features: ${comp.comprehensiveData?.key_features?.join(', ') || 'Not available'}
- Unique Selling Points: ${comp.comprehensiveData?.unique_selling_points?.join(', ') || 'Not available'}
- Shipping Threshold: ${comp.threshold === 0 ? 'Free' : comp.threshold ? `$${comp.threshold}` : 'Not found'}
- Shipping Banners: ${comp.comprehensiveData?.homepage_shipping_banners?.join(' | ') || 'None found'}
- Promotional Text: ${comp.comprehensiveData?.promotional_shipping_text?.join(' | ') || 'None found'}
  `).join('\n');

  const primaryContext = primaryData ? `
Primary Business Analysis:
Name: ${primaryData.business_name}
Description: ${primaryData.business_description || 'Not available'}
Summary: ${primaryData.business_summary || 'Not available'}
Products: ${primaryData.products?.join(', ') || 'Not available'}
Product Categories: ${primaryData.product_categories?.join(', ') || 'Not available'}
Shipping Info: ${primaryData.shipping_info ? `
  Has Free Shipping: ${primaryData.shipping_info.has_free_shipping}
  Conditions: ${primaryData.shipping_info.free_shipping_conditions || 'N/A'}
  Thresholds: ${primaryData.shipping_info.shipping_thresholds || 'N/A'}
  Regional Notes: ${primaryData.shipping_info.regional_shipping_notes || 'N/A'}
  General Policy: ${primaryData.shipping_info.general_shipping_policy || 'N/A'}` : 'Not available'}
  ` : `Primary Website: ${websiteUrl}`;

  const prompt = `Create a comprehensive competitive business analysis based on this data:

${primaryContext}

COMPETITOR ANALYSIS:
${competitorContext}

**IMPORTANT: Start your analysis with specific Industry classification and Business Overview.**

Provide a professional analysis covering:

## **Industry**: [SPECIFIC INDUSTRY - NOT "eCommerce"] 
Identify the specific industry sector based on products and market focus. Examples: "Food & Beverage - Specialty Jerky", "Apparel & Fashion - Athletic Wear", "Health & Wellness - Supplements", "Home & Garden - Furniture", etc.

## **Business Overview**
[Write 2-3 sentences describing what this business specifically does, their main products/services, and their primary value proposition. Be descriptive and specific - NOT generic like "operates in eCommerce space".]

## **Business Positioning Analysis**
- Primary business profile and market position
- Competitive landscape overview
- Market positioning relative to competitors

## **Product Portfolio Comparison** 
- Product differentiation and specialization
- Category analysis and competitive advantages
- Unique positioning in the market

## **Pricing Strategy Analysis**
- Market positioning by price tiers
- Pricing strategy compared to competitors
- Value proposition justification

## **Shipping Strategy Competitive Assessment**
- Free shipping threshold analysis
- Competitive advantages in shipping
- Market positioning through shipping policy

## **Unique Value Propositions**
- Key differentiators by brand
- Competitive advantages analysis
- Market positioning strengths

## **Market Positioning Summary**
- Strategic position in competitive landscape
- Key opportunities and recommendations
- Competitive advantages and market gaps

Focus on actionable insights and strategic positioning analysis. Be specific and descriptive throughout.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.1
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating business analysis:', error);
    return 'Analysis generation failed';
  }
}

// Generate strategic recommendations
async function generateRecommendations(primaryData: ComprehensiveBusinessData | null, competitors: any[], analysis: string): Promise<string> {
  const prompt = `Based on this competitive analysis and business data, provide 5-7 strategic recommendations:

${analysis}

Primary Business Data: ${JSON.stringify(primaryData, null, 2)}

Provide specific, actionable recommendations in this format:

## **Strategic Recommendations**

**1. [Recommendation Title]**
[Specific actionable advice with justification]

**2. [Recommendation Title]**
[Specific actionable advice with justification]

Continue with 5-7 total recommendations focused on competitive advantages, market positioning, customer experience, and growth opportunities.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.1
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return 'Recommendations generation failed';
  }
}

export async function POST(request: NextRequest) {
  let user_id: string | undefined;
  let session_id: string | undefined;
  
  try {
    const { website_url, user_id: extractedUserId, session_id: extractedSessionId } = await request.json();
    user_id = extractedUserId;
    session_id = extractedSessionId;

    if (!website_url) {
      return NextResponse.json({ 
        error: 'website_url is required' 
      }, { status: 400 });
    }

    // Start analysis timeout if user_id provided
    if (user_id) {
      startAnalysisTimeout(user_id, async () => {
        console.log(`Analysis timeout for user ${user_id}`);
      });
    }

    console.log(`Starting enhanced competitor analysis for: ${website_url}`);

    // Send initial progress update
    if (session_id) {
      sendProgressUpdate(session_id, {
        stage: 'Discovering Competitors',
        message: 'Searching for your top shipping competitors using AI...',
        progress: 5,
        completedStages: []
      });
    }

    // Stage 1: Comprehensive Primary Site Analysis
    console.log('Stage 1: Analyzing primary site with enhanced Firecrawl v1...');
    const rawPrimaryData = await comprehensiveFirecrawlAnalysis(website_url);
    const primarySiteData = await enhanceBusinessIntelligence(website_url, rawPrimaryData, rawPrimaryData?.business_name || 'Primary Business');

    // Stage 2: Competitor Discovery
    console.log('Stage 2: Discovering 10 competitors with OpenAI...');
    if (session_id) {
      sendProgressUpdate(session_id, {
        stage: 'Verifying URLs',
        message: 'Verifying competitor websites and checking accessibility...',
        progress: 15,
        completedStages: ['discovery']
      });
    }
    const competitors = await discoverCompetitorsWithOpenAI(website_url, primarySiteData);

    // Stage 3: Comprehensive Competitor Analysis with Batching
    console.log('Stage 3: Analyzing competitors with Firecrawl v1 in batches...');
    if (session_id) {
      sendProgressUpdate(session_id, {
        stage: 'Extracting Shipping Data',
        message: 'Scanning competitor checkout pages and shipping policies...',
        progress: 25,
        completedStages: ['discovery', 'verification']
      });
    }
    const competitorData = [];
    
    // Process 5 competitors for faster analysis (timeout optimization)
    const totalCompetitors = Math.min(competitors.length, 5);
    const batchSize = 3;
    const batches = [];
    
    for (let i = 0; i < totalCompetitors; i += batchSize) {
      batches.push(competitors.slice(i, i + batchSize));
    }
    
    console.log(`🚀 Processing ${totalCompetitors} competitors in ${batches.length} batches of ${batchSize} each (TIMEOUT OPTIMIZED)`);
    console.log(`📈 Streamlined analysis for faster completion\n`);
    
    // Process each batch sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\n🎯 === Processing Batch ${batchIndex + 1}/${batches.length} (${batch.length} competitors) ===`);
      
      // Reduced delay for faster processing (timeout optimization)
      if (batchIndex > 0) {
        console.log('⏸️ Waiting 2 seconds between batches...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Process competitors in current batch
      for (const competitor of batch) {
        try {
          console.log(`\n📊 [${competitorData.length + 1}/10] Analyzing ${competitor.name} (${competitor.website})...`);
          
          // Temporarily remove individual timeout to allow Firecrawl to complete
          // The main 5-minute timeout will still protect against infinite hanging
          const data = await comprehensiveFirecrawlAnalysis(competitor.website);
          
          console.log(`✅ Successfully extracted data from ${competitor.website}`);
          
          // Enhance with OpenAI business intelligence
          console.log(`🤖 Enhancing business intelligence for ${competitor.name}...`);
          const enhancedData = await enhanceBusinessIntelligence(competitor.website, data, competitor.name);
          
          console.log(`✅ [${competitorData.length + 1}/10] ${competitor.name} analysis complete!`);
          
          // Update progress after each competitor
          if (session_id) {
            const completedCount = competitorData.length + 1;
            const progressPercent = 25 + (completedCount / totalCompetitors) * 45; // 25-70%
            sendProgressUpdate(session_id, {
              stage: completedCount <= 5 ? 'Extracting Shipping Data' : 'Business Intelligence Analysis',
              message: `Analyzed ${completedCount}/${totalCompetitors} competitors - extracting ${competitor.name}'s pricing and return policies...`,
              progress: Math.round(progressPercent),
              completedStages: completedCount <= 5 ? ['discovery', 'verification'] : ['discovery', 'verification', 'extraction']
            });
          }
          
          competitorData.push({
            ...competitor,
            comprehensiveData: enhancedData,
            threshold: extractShippingThreshold(enhancedData),
            businessData: enhancedData, // For POC compatibility
            shippingAnalysis: enhancedData?.shipping_incentives?.[0] ? 
              `Policy: ${enhancedData.shipping_incentives[0].policy} | Threshold: ${enhancedData.shipping_incentives[0].threshold_amount || 'N/A'} | Delivery: ${enhancedData.shipping_incentives[0].delivery_timeframe || 'Not specified'}` :
              'No shipping data found'
          });
        } catch (error) {
          console.log(`❌ Skipping ${competitor.website} due to error:`, error instanceof Error ? error.message : 'Unknown error');
          
          // Add competitor with null data to maintain structure
          competitorData.push({
            ...competitor,
            comprehensiveData: null,
            threshold: null,
            businessData: null,
            shippingAnalysis: 'Analysis failed due to timeout'
          });
        }
        
        // Minimal delay for timeout optimization
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`🎯 Completed Batch ${batchIndex + 1}/${batches.length} - ${competitorData.length} competitors analyzed so far`);
    }

    console.log(`\n🎉 All ${competitorData.length} competitors successfully analyzed with comprehensive business intelligence!`);
    console.log(`📊 Now synthesizing final competitive analysis report...\n`);

    // Keep user's site data separate from competitors
    const userSiteData = {
      name: primarySiteData?.business_name || 'Your Business',
      website: website_url.replace(/^https?:\/\//, ''),
      products: primarySiteData?.products?.join(', ') || 'Products not specified',
      comprehensiveData: primarySiteData,
      threshold: extractShippingThreshold(primarySiteData),
      businessData: primarySiteData, // For POC compatibility
      shippingAnalysis: primarySiteData?.shipping_incentives?.[0] ? 
        `Policy: ${primarySiteData.shipping_incentives[0].policy} | Threshold: ${primarySiteData.shipping_incentives[0].threshold_amount || 'N/A'} | Delivery: ${primarySiteData.shipping_incentives[0].delivery_timeframe || 'Not specified'}` :
        'No shipping data found'
    };

    // Stage 4: Generate comprehensive analysis
    console.log('Stage 4: Synthesizing all data into competitive analysis...');
    if (session_id) {
      sendProgressUpdate(session_id, {
        stage: 'Synthesizing Report',
        message: 'Creating your comprehensive competitive analysis report...',
        progress: 85,
        completedStages: ['discovery', 'verification', 'extraction', 'intelligence']
      });
    }
    const businessAnalysis = await generateBusinessAnalysis(primarySiteData, competitorData, website_url);
    const recommendations = await generateRecommendations(primarySiteData, competitorData, businessAnalysis);

    // Calculate metrics from competitors only
    const thresholds = competitorData
      .map(comp => comp.threshold)
      .filter(t => t !== null && t !== undefined) as number[];
    
    const avgThreshold = thresholds.length > 0 ? 
      (thresholds.reduce((sum, t) => sum + t, 0) / thresholds.length).toFixed(2) : '0.00';
    
    const primaryThreshold = extractShippingThreshold(primarySiteData);

    // Store analysis in database if user_id provided
    if (user_id && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('analysis_history')
          .insert({
            user_id,
            website_url: website_url.replace(/^https?:\/\//, ''),
            analysis_type: 'enhanced-competitor-analysis',
            competitor_count: competitorData.length,
            status: 'completed',
            business_analysis: businessAnalysis,
            competitors_data: {
              competitors: competitorData,
              user_site_data: userSiteData,
              primary_threshold: primaryThreshold,
              average_threshold: parseFloat(avgThreshold),
              recommendations: recommendations,
              primarySiteData,
              analysis_date: new Date().toISOString()
            }
          });
        console.log('Analysis stored in database');
      } catch (dbError) {
        console.error('Database storage error:', dbError);
      }
    }

    // Stop timeout
    if (user_id) {
      stopAnalysisTimeout(user_id);
    }

    // Send final completion update
    if (session_id) {
      sendProgressUpdate(session_id, {
        stage: 'Synthesizing Report',
        message: 'Analysis complete! Your competitive report is ready.',
        progress: 100,
        completedStages: ['discovery', 'verification', 'extraction', 'intelligence', 'synthesis']
      });
    }

    // Return comprehensive results - Structure for both homepage and POC compatibility
    return NextResponse.json({
      success: true,
      message: `Enhanced competitor analysis completed for ${website_url}`,
      // Homepage expects direct access to these fields
      competitors: competitorData,
      user_site_data: userSiteData,
      business_analysis: businessAnalysis,
      recommendations: recommendations,
      // POC expects nested reportData structure
      reportData: {
        websiteUrl: website_url.replace(/^https?:\/\//, ''),
        competitorCount: competitorData.length,
        primaryThreshold,
        avgThreshold,
        thresholds,
        primarySiteData,
        user_site_data: userSiteData,
        competitors: competitorData,
        businessAnalysis,
        recommendations,
        reportType: 'enhanced-competitor-analysis',
        analysis_date: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Enhanced competitor analysis error:', error);
    
    if (user_id) {
      stopAnalysisTimeout(user_id);
    }

    // Handle specific JSON parsing errors
    let errorMessage = 'Enhanced competitor analysis failed';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorDetails.includes('Unexpected token')) {
      errorMessage = 'Data parsing error - please try again';
      errorDetails = 'The analysis service returned invalid data. This may be temporary.';
    } else if (errorDetails.includes('Failed to fetch') || errorDetails.includes('network')) {
      errorMessage = 'Network connection error';
      errorDetails = 'Unable to connect to analysis services. Please check your connection and try again.';
    } else if (errorDetails.includes('Firecrawl')) {
      errorMessage = 'Website analysis error';
      errorDetails = 'Unable to analyze website content. The site may be blocking automated access.';
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}