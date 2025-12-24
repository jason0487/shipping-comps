import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Set maximum execution time to 10 minutes for Railway (Pro plan supports up to 15 minutes)
export const maxDuration = 600;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is missing');
  }
  return new OpenAI({ apiKey });
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Firecrawl configuration for comprehensive shipping data extraction
interface FirecrawlShippingData {
  has_free_shipping: boolean;
  free_shipping_conditions?: string;
  shipping_thresholds?: string;
  regional_shipping_notes?: string;
  shipping_incentives?: string;
  general_shipping_policy?: string;
  homepage_shipping_banners?: string[];
  promotional_shipping_text?: string[];
  raw_shipping_snippets?: string[];
  free_shipping_incentives?: Array<{
    description: string;
    validity_period?: string;
    minimum_purchase?: number;
  }>;
}

interface FirecrawlBusinessData {
  business_name?: string;
  business_description?: string;
  business_summary?: string;
  shipping_info?: FirecrawlShippingData;
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
  shipping_incentives?: string;
  threshold?: number | null;
  firecrawlData?: FirecrawlBusinessData | null;
}

// Scrape website content
async function scrapeWebsite(url: string): Promise<string> {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = await response.text();
    
    // Basic text extraction (simplified)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return textContent.substring(0, 15000); // Limit content
  } catch (error) {
    console.error('Scraping error:', error);
    return '';
  }
}

// Analyze e-commerce site
async function analyzeEcommerceSite(websiteContent: string): Promise<string> {
  const prompt = `Analyze this e-commerce website content and provide a detailed business analysis:

Website Content:
${websiteContent}

Provide analysis in this format:
**Industry:** [Industry category]
**Product Focus:** [Main product categories and types]
**Target Market:** [Primary customer demographics and segments]
**Key Differentiators:** [Unique selling propositions and competitive advantages]
**Global Reach:** [Geographic markets and international presence]
**Brand Appeal:** [Brand positioning and customer appeal factors]

Focus on business characteristics, target audience, product categories, and competitive positioning.`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || 'Analysis not available';
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    return 'Business analysis unavailable due to API limitations';
  }
}

// Find competitors
async function findCompetitors(siteAnalysis: string): Promise<Competitor[]> {
  const prompt = `Based on this e-commerce business analysis, identify 10 direct competitors:

Business Analysis:
${siteAnalysis}

Return exactly 10 competitors in this JSON format:
[
  {
    "name": "Competitor Name",
    "website": "website.com",
    "products": "Brief description of their main products"
  }
]

Focus on direct competitors in the same industry with similar products and target market.`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (error) {
    console.error('Competitor finding error:', error);
    return [];
  }
}

// Analyze competitor shipping with Firecrawl (same approach as main analyze route)
async function analyzeCompetitorShippingWithFirecrawl(competitor: Competitor): Promise<{ shippingText: string; threshold: number | null; data: FirecrawlBusinessData | null }> {
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  
  if (!firecrawlApiKey) {
    console.error('Firecrawl API key not configured');
    return { shippingText: 'Shipping analysis unavailable - API key not configured', threshold: null, data: null };
  }

  let websiteUrl = competitor.website;
  if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
    websiteUrl = 'https://' + websiteUrl;
  }

  try {
    console.log(`Firecrawl: Analyzing shipping for ${competitor.name} (${websiteUrl})...`);

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
          prompt: `CRITICAL: Look carefully for shipping information displayed anywhere on this website, especially in header banners, promotional bars, and navigation areas.

**SHIPPING INFORMATION - SEARCH EVERYWHERE:**
- **HEADER/BANNER TEXT**: Look for any text at the top of the page mentioning shipping (e.g., "Free Shipping on orders over $X", "Free delivery", "Complimentary shipping")
- **PROMOTIONAL BANNERS**: Check any colored bars, announcement banners, or promotional messages about shipping
- **NAVIGATION AREAS**: Look for shipping mentions in menu items, top bars, or sticky headers
- **EXACT TEXT CAPTURE**: Record the exact wording of any shipping-related text found
- **THRESHOLD DETECTION**: Identify specific dollar amounts for free shipping and extract the numeric value (e.g., if you see "$75", extract 75 as a number)
- **STRUCTURED INCENTIVES**: For each shipping offer found, create a structured object with the description, any validity period, and the minimum purchase amount as a number
- **CONDITIONS**: Note any conditions like "Continental US only", "Domestic shipping", membership requirements
- **FOOTER SHIPPING**: Check footer sections for shipping policy links or mentions
- **CART/CHECKOUT HINTS**: Look for shipping mentions near add-to-cart buttons or product pages

IMPORTANT: Even if shipping information seems minimal, capture ANY mention of delivery, shipping costs, free shipping thresholds, or shipping-related text found anywhere on the page.`,
          schema: {
            type: "object",
            properties: {
              shipping_info: {
                type: "object",
                properties: {
                  has_free_shipping: { type: "boolean" },
                  free_shipping_incentives: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string", description: "Exact text describing the shipping offer" },
                        validity_period: { type: "string", description: "Time period or conditions when offer is valid" },
                        minimum_purchase: { type: "number", description: "Dollar amount threshold for free shipping (e.g., 75 for $75)" }
                      },
                      required: ["description"]
                    },
                    description: "Structured shipping incentives with specific thresholds and conditions"
                  },
                  free_shipping_conditions: { type: "string", description: "General conditions for free shipping found on the website" },
                  shipping_thresholds: { type: "string", description: "Text description of minimum order amounts for free shipping" },
                  regional_shipping_notes: { type: "string", description: "Geographic restrictions or regional shipping details" },
                  shipping_incentives: { type: "string", description: "General shipping promotions or incentives offered" },
                  general_shipping_policy: { type: "string", description: "General shipping information or policy details" },
                  homepage_shipping_banners: {
                    type: "array",
                    items: { type: "string" },
                    description: "Exact text from any shipping banners, headers, or promotional bars on the homepage"
                  },
                  promotional_shipping_text: {
                    type: "array", 
                    items: { type: "string" },
                    description: "Any promotional text mentioning shipping, delivery, or related offers"
                  },
                  raw_shipping_snippets: {
                    type: "array",
                    items: { type: "string" },
                    description: "All shipping-related text snippets found anywhere on the website"
                  }
                },
                required: []
              },
              business_name: { type: "string" },
              business_description: { type: "string" },
              business_summary: { type: "string" }
            },
            required: []
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl failed for ${websiteUrl}: ${response.status} ${response.statusText}`);
      console.error(`Error response body:`, errorText);
      return { shippingText: 'Shipping information not available', threshold: null, data: null };
    }

    const scrapeData = await response.json();

    if (!scrapeData.success) {
      console.error(`Firecrawl failed for ${websiteUrl}:`, scrapeData.error);
      return { shippingText: 'Shipping information not available', threshold: null, data: null };
    }

    const extractedData = scrapeData.data?.extract as FirecrawlBusinessData || null;
    
    // Handle case where Firecrawl returns success but no extract data
    if (!extractedData) {
      console.log(`Firecrawl returned no extract data for ${websiteUrl}`);
      return { shippingText: 'Shipping information not available', threshold: null, data: null };
    }
    
    if (!extractedData.shipping_info) {
      console.log(`No shipping info found for ${websiteUrl}`);
      // Return what we have, even if no shipping info
      return { shippingText: 'No shipping information found', threshold: null, data: extractedData };
    }

    const shippingInfo = extractedData.shipping_info;
    
    // Combine all shipping text sources for display
    const allShippingText = [
      shippingInfo.free_shipping_conditions || '',
      shippingInfo.shipping_thresholds || '',
      shippingInfo.shipping_incentives || '',
      shippingInfo.general_shipping_policy || '',
      ...(shippingInfo.homepage_shipping_banners || []),
      ...(shippingInfo.raw_shipping_snippets || [])
    ].filter(text => text && text.trim().length > 0);
    
    // Format shipping text for display
    let shippingText = allShippingText.length > 0 
      ? allShippingText.slice(0, 3).join(' • ')
      : (shippingInfo.has_free_shipping ? 'Free shipping available' : 'Shipping information limited');
    
    // Extract threshold from structured incentives first
    let threshold: number | null = null;
    
    if (shippingInfo.free_shipping_incentives && shippingInfo.free_shipping_incentives.length > 0) {
      for (const incentive of shippingInfo.free_shipping_incentives) {
        if (typeof incentive.minimum_purchase === 'number') {
          threshold = incentive.minimum_purchase;
          break;
        }
      }
    }
    
    // Fallback to text-based extraction if no structured threshold
    if (threshold === null) {
      threshold = extractShippingThresholdFromText(shippingText);
    }
    
    // If still no threshold but has free shipping, assume $0
    if (threshold === null && shippingInfo.has_free_shipping && !shippingText.includes('$')) {
      threshold = 0;
    }

    console.log(`Firecrawl: ${competitor.name} - Threshold: $${threshold ?? 'N/A'}, Text: ${shippingText.substring(0, 100)}...`);
    
    return { shippingText, threshold, data: extractedData };
  } catch (error) {
    console.error('Firecrawl API error for', competitor.name, ':', error);
    return { shippingText: 'Shipping analysis unavailable', threshold: null, data: null };
  }
}

// Extract shipping threshold from text (fallback method)
function extractShippingThresholdFromText(shippingText: string): number | null {
  if (!shippingText) return null;
  
  const thresholdPatterns = [
    /free shipping.*?[\$](\d+)/i,
    /[\$](\d+).*?free shipping/i,
    /orders over [\$](\d+)/i,
    /minimum [\$](\d+)/i,
    /spend [\$](\d+)/i,
    /over \$(\d+)/i,
    /\$(\d+)\+?\s*(?:for\s+)?free/i,
  ];

  for (const pattern of thresholdPatterns) {
    const match = shippingText.match(pattern);
    if (match) {
      const threshold = parseInt(match[1]);
      if (threshold > 0 && threshold <= 500) {
        return threshold;
      }
    }
  }

  // Check for free shipping with no threshold
  if (/free shipping/i.test(shippingText) && !/\$\d+/i.test(shippingText)) {
    return 0;
  }

  return null;
}

// Extract shipping threshold from text
function extractShippingThreshold(shippingText: string): number | null {
  if (!shippingText) return null;
  
  const thresholdPatterns = [
    /free shipping.*?[\$](\d+)/i,
    /[\$](\d+).*?free shipping/i,
    /orders over [\$](\d+)/i,
    /minimum [\$](\d+)/i,
    /spend [\$](\d+)/i,
  ];

  for (const pattern of thresholdPatterns) {
    const match = shippingText.match(pattern);
    if (match) {
      const threshold = parseInt(match[1]);
      if (threshold > 0 && threshold <= 500) {
        return threshold;
      }
    }
  }

  // Check for free shipping with no threshold
  if (/free shipping/i.test(shippingText) && !/\$\d+/i.test(shippingText)) {
    return 0;
  }

  return null;
}

// Generate actionable recommendations
function generateActionableRecommendations(
  businessAnalysis: string,
  competitors: Competitor[],
  medianThreshold: number
): string {
  const competitorsWithShipping = competitors.filter(c => c.shipping_incentives);
  const thresholds = competitors
    .map(c => extractShippingThreshold(c.shipping_incentives || ''))
    .filter(t => t !== null) as number[];

  const minThreshold = Math.min(...thresholds.filter(t => t > 0));
  const maxThreshold = Math.max(...thresholds);
  const freeShippingCount = thresholds.filter(t => t === 0).length;

  return `
    <div style="background: #f8f9fa; padding: 24px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #1a1a1a; margin-bottom: 16px;">📋 Actionable Recommendations</h3>
      
      <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 16px; border-left: 4px solid #10b981;">
        <h4 style="color: #10b981; margin-bottom: 12px;">🎯 Immediate Actions (This Week)</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">
            <strong>Set Competitive Threshold:</strong> 
            ${medianThreshold > 0 
              ? `Consider a $${Math.max(25, medianThreshold - 10).toFixed(2)}-$${(medianThreshold - 5).toFixed(2)} free shipping threshold to undercut the $${medianThreshold.toFixed(2)} market median`
              : `With ${freeShippingCount} competitors offering free shipping, evaluate offering free shipping on orders over $${(minThreshold > 0 ? minThreshold - 10 : 35).toFixed(2)}`
            }
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Audit Current Policy:</strong> Review your shipping costs and identify areas where you can absorb costs to remain competitive
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Update Messaging:</strong> Prominently display your shipping offer on homepage, product pages, and checkout
          </li>
        </ul>
      </div>

      <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 16px; border-left: 4px solid #f59e0b;">
        <h4 style="color: #f59e0b; margin-bottom: 12px;">🚀 Strategic Implementation (30 Days)</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">
            <strong>Differentiate Delivery Speed:</strong> 
            ${thresholds.some(t => t > 100) 
              ? 'Offer faster delivery than competitors with high thresholds'
              : 'Focus on premium delivery options (same-day, next-day) as a differentiator'
            }
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Bundle Strategy:</strong> Create product bundles that naturally reach your free shipping threshold
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Geographic Targeting:</strong> Test regional shipping offers in high-value markets
          </li>
        </ul>
      </div>

      <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #8b5cf6;">
        <h4 style="color: #8b5cf6; margin-bottom: 12px;">🎨 Advanced Optimization (60-90 Days)</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">
            <strong>Dynamic Thresholds:</strong> Implement A/B testing for different shipping thresholds by customer segment
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Loyalty Integration:</strong> Offer free shipping as a loyalty program benefit
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Seasonal Adjustments:</strong> Plan promotional shipping offers during high-traffic periods
          </li>
        </ul>
      </div>
    </div>
  `;
}

// Generate shipping threshold gauge section with trend and large number
function generateShippingGauge(medianThreshold: number, competitorCount: number = 10): string {
  // Calculate percentage for gauge position
  const percentage = Math.min(100, (medianThreshold / 200) * 100);
  
  // Mock trend data for email (in production, this would come from historical data)
  const previousThreshold = medianThreshold - 5;
  const trendChange = medianThreshold - previousThreshold;
  const trendText = trendChange > 0 ? 'rose by' : trendChange < 0 ? 'decreased by' : 'remained at';
  const trendAmount = Math.abs(trendChange);
  
  return `
    <div style="background: #f8f9fa; padding: 32px; border-radius: 8px; margin: 20px 0;">
      <!-- Top row - Market insight text -->
      <div style="margin-bottom: 32px; padding-right: 128px;">
        <p style="color: #9ca3af; font-size: 24px; line-height: 1.25; margin: 0; font-weight: 500;">
          The market median free shipping threshold 
          <span style="color: #1f2937; font-weight: 600;">${trendText} $${trendAmount.toFixed(2)}</span> in the past two weeks.
        </p>
      </div>
      
      <!-- Bottom row - 2 columns (50/50 split) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center;">
        <!-- Left - Large threshold number -->
        <div style="padding-right: 32px;">
          <div style="font-size: 64px; font-weight: 700; color: #1f2937; margin-bottom: 8px; line-height: 1;">
            $${medianThreshold.toFixed(0)}
          </div>
          <p style="color: #6b7280; font-size: 16px; margin: 0;">
            Median threshold across ${competitorCount} key competitors
          </p>
        </div>
        
        <!-- Right - Simple Color Bar Gauge -->
        <div style="text-align: right; position: relative; width: 200px; height: 120px; margin-left: auto;">
          <!-- Simple horizontal bar gauge -->
          <div style="
            position: relative;
            width: 160px;
            height: 20px;
            margin: 20px auto 15px auto;
            border-radius: 10px;
            overflow: hidden;
            display: flex;
          ">
            <!-- Green zone (left third) -->
            <div style="
              width: 53px;
              height: 20px;
              background: #10b981;
            "></div>
            
            <!-- Yellow zone (middle third) -->
            <div style="
              width: 54px;
              height: 20px;
              background: #f59e0b;
            "></div>
            
            <!-- Red zone (right third) -->
            <div style="
              width: 53px;
              height: 20px;
              background: #ef4444;
            "></div>
          </div>
          
          <!-- Needle indicator -->
          <div style="
            position: absolute;
            width: 2px;
            height: 30px;
            background: #1f2937;
            left: calc(50% + ${(percentage - 50) * 1.6}px);
            top: 15px;
            border-radius: 1px;
          "></div>
          
          <!-- Labels -->
          <div style="display: flex; justify-content: space-between; margin-top: 8px; font-family: system-ui, -apple-system, sans-serif; font-size: 12px; font-weight: 500; color: #6b7280;">
            <span>$0</span>
            <span style="margin-left: -10px;">$100</span>
            <span>$200+</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Generate competitor threshold changes section with mock data
function generateCompetitorChanges(): string {
  const mockChanges = [
    { name: "Lululemon", currentThreshold: 99, previousThreshold: 150, change: "down" },
    { name: "Alo Yoga", currentThreshold: 75, previousThreshold: 75, change: "none" },
    { name: "Outdoor Voices", currentThreshold: 50, previousThreshold: 35, change: "up" },
    { name: "Girlfriend Collective", currentThreshold: 0, previousThreshold: 25, change: "down" },
    { name: "Everlane", currentThreshold: 100, previousThreshold: 100, change: "none" }
  ];

  return `
    <div style="margin: 20px 0; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h3 style="color: #1a1a1a; margin-bottom: 16px; font-size: 18px;">📊 Recent Threshold Changes</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        ${mockChanges.map(competitor => {
          const arrow = competitor.change === 'down' ? '↓' : competitor.change === 'up' ? '↑' : '→';
          const arrowColor = competitor.change === 'down' ? '#10b981' : competitor.change === 'up' ? '#ef4444' : '#6b7280';
          const changeText = competitor.change === 'none' ? 'No change' : 
            `$${competitor.previousThreshold} → $${competitor.currentThreshold}`;
          
          // Generate company logo URL
          const logoUrl = `https://logo.clearbit.com/${competitor.name.toLowerCase().replace(/\s+/g, '').replace('collective', 'collection')}.com`;
          
          return `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${arrowColor};">
              <!-- Company Header with Logo -->
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <img 
                  src="${logoUrl}" 
                  alt="${competitor.name} logo"
                  style="
                    width: 24px; 
                    height: 24px; 
                    border-radius: 4px; 
                    margin-right: 8px; 
                    background-color: white; 
                    border: 1px solid #e5e7eb;
                  "
                  onerror="this.parentNode.removeChild(this)"
                />
                <div style="font-weight: 600; font-size: 16px; color: #1f2937; line-height: 1.2;">
                  ${competitor.name}
                </div>
              </div>
              
              <!-- Prominent Current Threshold -->
              <div style="display: flex; align-items: baseline; margin-bottom: 8px;">
                <span style="font-size: 28px; font-weight: 700; color: #1f2937; margin-right: 8px;">
                  $${competitor.currentThreshold}
                </span>
                <span style="
                  font-size: 16px; 
                  font-weight: 600; 
                  color: ${arrowColor};
                ">
                  ${arrow}
                </span>
              </div>
              
              <!-- Change Details -->
              <div style="font-size: 13px; color: #6b7280; font-weight: 500;">
                ${changeText}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, userEmail, website_url, user_email, report_type = 'biweekly', subscription_id } = await request.json();

    // Handle both old and new parameter formats for compatibility
    const finalWebsiteUrl = websiteUrl || website_url;
    const finalUserEmail = userEmail || user_email;

    if (!finalWebsiteUrl || !finalUserEmail) {
      return NextResponse.json({ error: 'Website URL and user email are required' }, { status: 400 });
    }

    const isWelcomeReport = report_type === 'welcome_report';
    console.log(`Generating ${isWelcomeReport ? 'welcome' : 'bi-weekly'} report for ${finalWebsiteUrl}...`);

    // Step 1: Scrape website
    const websiteContent = await scrapeWebsite(finalWebsiteUrl);
    if (!websiteContent) {
      return NextResponse.json({ error: 'Failed to scrape website content' }, { status: 400 });
    }

    // Step 2: Analyze business
    const businessAnalysis = await analyzeEcommerceSite(websiteContent);

    // Step 3: Find competitors
    const competitors = await findCompetitors(businessAnalysis);
    
    // Step 4: Analyze competitor shipping with Firecrawl (use all 10 competitors for comprehensive analysis)
    const limitedCompetitors = competitors.slice(0, 10);
    const enhancedCompetitors: Competitor[] = [];
    
    console.log(`Analyzing shipping for ${limitedCompetitors.length} competitors using Firecrawl...`);
    
    for (const competitor of limitedCompetitors) {
      const { shippingText, threshold, data } = await analyzeCompetitorShippingWithFirecrawl(competitor);
      enhancedCompetitors.push({
        ...competitor,
        shipping_incentives: shippingText,
        threshold: threshold,
        firecrawlData: data
      });
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Completed Firecrawl analysis for all ${enhancedCompetitors.length} competitors`);

    // Step 5: Calculate median threshold using Firecrawl-extracted thresholds (more accurate than text parsing)
    const thresholds = enhancedCompetitors
      .map(c => c.threshold ?? extractShippingThreshold(c.shipping_incentives || ''))
      .filter(t => t !== null) as number[];
    
    const medianThreshold = thresholds.length > 0 ? 
      (() => {
        const sorted = [...thresholds].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 
          ? sorted[mid] 
          : (sorted[mid - 1] + sorted[mid]) / 2;
      })() : 75;

    // Step 6: Generate report HTML with customized header
    const reportTitle = isWelcomeReport ? 'Welcome to Shipping Comps! Your First Report' : 'Bi-Weekly Shipping Intelligence Report';
    const welcomeMessage = isWelcomeReport ? `
      <div style="background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 10px 0;">🎉 Welcome to Shipping Comps!</h2>
        <p style="margin: 0; font-size: 16px;">Thank you for subscribing! Here's your first competitor analysis report.</p>
      </div>
    ` : '';

    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
          .gauge-section { text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .competitor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin: 20px 0; }
          .competitor-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .competitor-name { font-weight: bold; color: #1a1a1a; margin-bottom: 8px; }
          .competitor-website { color: #6b7280; margin-bottom: 12px; }
          .shipping-info { background: #f0f7ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; }
          .cta-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 8px; margin: 30px 0; }
          .cta-button { display: inline-block; background: white; color: #667eea; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        ${welcomeMessage}
        <div class="header">
          <h1>${reportTitle}</h1>
          <p style="font-size: 18px; margin: 10px 0; color: white;">For ${finalWebsiteUrl}</p>
          <p style="font-size: 14px; opacity: 0.8;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        ${generateShippingGauge(medianThreshold, enhancedCompetitors.length)}

        ${generateCompetitorChanges()}

        <div style="margin: 30px 0;">
          <h2>Business Analysis</h2>
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            ${businessAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
          </div>
        </div>

        ${generateActionableRecommendations(businessAnalysis, enhancedCompetitors, medianThreshold)}

        <div style="margin: 30px 0;">
          <h2>Competitor Shipping Analysis</h2>
          <div class="competitor-grid">
            ${enhancedCompetitors.map(competitor => {
              // Extract and format shipping info more concisely
              let shippingInfo = competitor.shipping_incentives || 'Analysis not available';
              
              // Limit text length and clean up formatting
              if (shippingInfo.length > 200) {
                shippingInfo = shippingInfo.substring(0, 200) + '...';
              }
              
              // Replace bullet points with line breaks for better readability
              shippingInfo = shippingInfo
                .replace(/•/g, '<br>•')
                .replace(/\n/g, '<br>')
                .replace(/^\s*<br>/, ''); // Remove leading line break
              
              return `
              <div class="competitor-card">
                <div class="competitor-name">${competitor.name}</div>
                <div class="competitor-website" style="font-size: 14px; margin-bottom: 8px;">${competitor.website}</div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">${competitor.products}</div>
                <div class="shipping-info" style="font-size: 14px; line-height: 1.4;">
                  ${shippingInfo}
                </div>
              </div>
              `;
            }).join('')}
          </div>
        </div>

        <div style="
          background: #FBFAF9;
          padding: 40px;
          border-radius: 12px;
          margin: 30px 0;
          text-align: center;
          border: 1px solid #e6d7c3;
        ">
          <h2 style="color: #2d3748; margin-bottom: 24px; font-size: 28px; font-weight: 600;">
            Ready to Optimize Your Shipping?
          </h2>
          
          <div style="margin-bottom: 20px;">
            <img src="https://e5b9ab02-65fa-4b25-b108-ba22f4f0cea8-00-3075emvw4q1m6.spock.replit.dev/images/deliveri-logo.png" 
                 alt="Deliveri" 
                 style="height: 40px; width: auto; max-width: 200px;"
            />
          </div>
          
          <p style="color: #4a5568; margin-bottom: 24px; font-size: 18px; font-weight: 500;">
            Deliveri can help you with:
          </p>
          
          <ul style="
            text-align: left;
            display: inline-block;
            margin: 20px 0;
            color: #4a5568;
            font-size: 16px;
            line-height: 1.8;
          ">
            <li>Multi-carrier shipping optimization</li>
            <li>Real-time rate shopping</li>
            <li>Automated shipping rules</li>
            <li>Upfront Duties and Taxes</li>
            <li>Shipping Insurance</li>
            <li>Integration with your e-commerce platform (Shopify, Etsy, etc.)</li>
          </ul>
          
          <p style="color: #4a5568; margin: 30px 0 20px 0; font-size: 18px; font-weight: 600;">
            Schedule a free consultation to discuss your shipping strategy!
          </p>
          
          <a href="https://www.ondeliveri.com/booking" style="
            background: #2d3748;
            color: white;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 20px;
          ">
            Book Your Free Demo
          </a>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
            Simply reply to this email or visit 
            <a href="https://www.ondeliveri.com/booking" style="color: #3182ce; text-decoration: underline;">
              www.ondeliveri.com/booking
            </a>
          </p>
        </div>

        <div style="text-align: center; margin-top: 40px; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
          <p>This report was generated by <strong>Shipping Comps</strong> by Deliveri Labs</p>
          <p>Questions? Reply to this email or contact us at <a href="mailto:support@ondeliveri.com">support@ondeliveri.com</a></p>
        </div>
      </body>
      </html>
    `;

    // Step 7: Send email (using the email service)
    const emailSent = await sendBiweeklyReport(finalUserEmail, reportHtml, finalWebsiteUrl, isWelcomeReport);

    // Step 8: Log bi-weekly email to both internal database and Google Sheets
    await logBiweeklyEmail({
      user_email: finalUserEmail,
      website_url: finalWebsiteUrl,
      report_type: report_type,
      subscription_id: subscription_id || null,
      email_sent_successfully: emailSent,
      competitor_count: enhancedCompetitors.length,
      avg_threshold: medianThreshold
    });

    return NextResponse.json({
      success: true,
      message: `${isWelcomeReport ? 'Welcome' : 'Bi-weekly'} report generated and ${emailSent ? 'sent' : 'prepared'} for ${finalWebsiteUrl}`,
      reportData: {
        websiteUrl: finalWebsiteUrl,
        businessAnalysis,
        competitorCount: enhancedCompetitors.length,
        avgThreshold: medianThreshold.toFixed(2),
        thresholds,
        reportType: report_type
      }
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate bi-weekly report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Email sending function
async function sendBiweeklyReport(email: string, htmlContent: string, websiteUrl: string, isWelcomeReport: boolean = false): Promise<boolean> {
  try {
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendgridApiKey) {
      console.error('SendGrid API key not configured, skipping email send');
      return false;
    }

    const subject = isWelcomeReport 
      ? `🎉 Welcome to Shipping Comps! Your First Report is Ready` 
      : `Your Bi-Weekly Shipping Intelligence Report - ${new Date().toLocaleDateString()}`;

    const emailPayload = {
      personalizations: [{
        to: [{ email }],
        subject
      }],
      from: {
        email: 'yourcustomreport@ondeliveri.com',
        name: 'Shipping Comps by Deliveri Labs'
      },
      content: [{
        type: 'text/html',
        value: htmlContent
      }]
    };

    console.log(`Sending biweekly email to ${email} with subject: ${subject}`);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SendGrid error - Status: ${response.status}, Response: ${errorText}`);
      console.error('Email payload that failed:', JSON.stringify(emailPayload, null, 2));
      return false;
    }

    console.log(`Successfully sent biweekly email to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

// Bi-weekly email logging function for both internal DB and Google Sheets
async function logBiweeklyEmail(data: {
  user_email: string;
  website_url: string;
  report_type: string;
  subscription_id?: string | null;
  email_sent_successfully: boolean;
  competitor_count: number;
  avg_threshold: number;
}): Promise<void> {
  try {
    // Log to internal database
    const supabase = getSupabaseClient();
    const { error: dbError } = await supabase
      .from('biweekly_email_logs')
      .insert({
        user_email: data.user_email,
        website_url: data.website_url,
        report_type: data.report_type,
        subscription_id: data.subscription_id || null,
        email_sent_successfully: data.email_sent_successfully,
        competitor_count: data.competitor_count,
        avg_threshold: data.avg_threshold,
        sent_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database logging error:', dbError);
    } else {
      console.log(`Successfully logged bi-weekly email to database: ${data.website_url}`);
    }

    // Log to Google Sheets
    const sheetsLogged = await logBiweeklyEmailToSheets({
      user_email: data.user_email,
      website_url: data.website_url,
      report_type: data.report_type,
      subscription_id: data.subscription_id || undefined,
      email_sent_successfully: data.email_sent_successfully,
      competitor_count: data.competitor_count,
      avg_threshold: data.avg_threshold,
      timestamp: new Date().toISOString()
    });

    if (sheetsLogged) {
      console.log(`Successfully logged bi-weekly email to Google Sheets: ${data.website_url}`);
    }
  } catch (error) {
    console.error('Error logging bi-weekly email:', error);
  }
}

// Google Sheets logging function for bi-weekly emails
async function logBiweeklyEmailToSheets(data: {
  user_email: string;
  website_url: string;
  report_type: string;
  subscription_id?: string;
  email_sent_successfully: boolean;
  competitor_count: number;
  avg_threshold: number;
  timestamp: string;
}): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_BIWEEKLY_URL || process.env.GOOGLE_APPS_SCRIPT_URL;
  
  if (!webhookUrl) {
    console.log("Warning: GOOGLE_APPS_SCRIPT_BIWEEKLY_URL not configured, using fallback");
    return false;
  }
  
  console.log(`Logging bi-weekly email to Google Sheets: ${data.website_url}`);
  
  try {
    const payload = {
      sheet_type: 'biweekly_emails', // Identifier for the second worksheet
      user_email: data.user_email,
      website_url: data.website_url,
      report_type: data.report_type,
      subscription_id: data.subscription_id || 'N/A',
      email_sent: data.email_sent_successfully ? 'SUCCESS' : 'FAILED',
      competitor_count: data.competitor_count,
      avg_threshold: `$${data.avg_threshold.toFixed(2)}`,
      timestamp: data.timestamp
    };
    
    console.log(`Sending bi-weekly email payload to Google Sheets:`, payload);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log(`Google Sheets bi-weekly response status: ${response.status}`);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log(`Google Sheets bi-weekly response: ${responseText}`);
      
      try {
        const result = JSON.parse(responseText);
        if (result.status === 'success') {
          return true;
        } else {
          console.log(`Google Sheets bi-weekly API error: ${result.message || 'Unknown error'}`);
          return false;
        }
      } catch (jsonError) {
        console.log(`Invalid JSON response from bi-weekly sheets: ${responseText}`);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log(`HTTP error logging bi-weekly email to Google Sheets: ${response.status}`);
      console.log(`Response body: ${errorText}`);
      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Network error logging bi-weekly email to Google Sheets: ${error.message}`);
    } else {
      console.error(`Unexpected error logging bi-weekly email to Google Sheets: ${error}`);
    }
    return false;
  }
}