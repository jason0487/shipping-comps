import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ComprehensiveBusinessData {
  business_details: {
    name: string;
    description: string;
    mission_statement?: string;
    target_audience?: string;
    unique_selling_points?: string[];
    products: string[];
    product_categories?: string[];
    price_range?: string;
    key_features?: string[];
  };
  shipping_incentives: Array<{
    policy: string;
    free_shipping_tier: string;
    threshold_amount?: string;
    delivery_timeframe?: string;
  }>;
  return_policy?: {
    return_window?: string;
    return_conditions?: string;
    refund_policy?: string;
  };
  customer_service?: {
    contact_methods?: string[];
    support_hours?: string;
    response_time?: string;
  };
  promotions?: Array<{
    offer_type: string;
    description: string;
    terms: string;
  }>;
}

interface Competitor {
  name: string;
  website: string;
  products: string;
  comprehensiveData?: ComprehensiveBusinessData;
  threshold?: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const { website_url } = await request.json();

    if (!website_url) {
      return NextResponse.json({ 
        error: 'website_url is required' 
      }, { status: 400 });
    }

    console.log(`Starting enhanced competitor analysis for: ${website_url}`);

    // Stage 1: Comprehensive Primary Site Analysis
    console.log('Stage 1: Analyzing primary site with enhanced Firecrawl v1...');
    const primarySiteData = await comprehensiveFirecrawlAnalysis(website_url);

    // Stage 2: Competitor Discovery with OpenAI
    console.log('Stage 2: Discovering 10 competitors with OpenAI...');
    const competitors = await discoverCompetitorsWithOpenAI(website_url, primarySiteData);

    // Stage 3: Comprehensive Competitor Analysis
    console.log('Stage 3: Analyzing all competitors with Firecrawl v1...');
    const competitorData = await Promise.all(
      competitors.slice(0, 10).map(async (competitor) => {
        const data = await comprehensiveFirecrawlAnalysis(competitor.website);
        return {
          ...competitor,
          comprehensiveData: data?.extractedData || {},
          threshold: extractShippingThreshold(data?.extractedData?.shipping_incentives || [])
        };
      })
    );

    // Stage 4: Synthesize Data and Generate Professional Report
    console.log('Stage 4: Synthesizing all data into competitive analysis...');
    const { competitiveAnalysis, recommendations, avgThreshold } = await generateComprehensiveReport(
      website_url,
      primarySiteData,
      competitorData
    );

    // Calculate metrics for compatibility with current system
    const thresholds = competitorData.map(c => c.threshold || 0);
    const primaryThreshold = extractShippingThreshold(primarySiteData?.extractedData?.shipping_incentives || []);

    const response = {
      success: true,
      message: `Enhanced competitor analysis completed for ${website_url}`,
      reportData: {
        websiteUrl: website_url,
        businessAnalysis: competitiveAnalysis,
        competitorCount: competitorData.length,
        avgThreshold: avgThreshold.toFixed(2),
        thresholds: thresholds,
        primaryThreshold: primaryThreshold,
        primarySiteData: primarySiteData?.extractedData || {},
        competitors: competitorData.map(c => ({
          name: c.name,
          website: c.website,
          threshold: c.threshold,
          businessData: c.comprehensiveData,
          shippingAnalysis: formatShippingAnalysis(c.comprehensiveData?.shipping_incentives || [])
        })),
        recommendations: recommendations,
        reportType: 'enhanced-comprehensive-analysis'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Enhanced competitor analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to complete enhanced analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Enhanced Firecrawl V1 Analysis with Comprehensive Business Intelligence
async function comprehensiveFirecrawlAnalysis(websiteUrl: string): Promise<any> {
  try {
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl;
    }

    console.log(`Firecrawl v1: Analyzing ${websiteUrl}...`);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: websiteUrl,
        formats: ['json'],
        jsonOptions: {
          prompt: 'Extract comprehensive business intelligence and shipping data from this e-commerce website. Analyze the complete business profile including company identity, market positioning, product portfolio, pricing strategy, customer value propositions, shipping policies, return policies, and competitive advantages. Look for brand mission, target audience, unique selling points, product categories, price points, shipping thresholds, delivery promises, return terms, customer service details, and any promotional offers.',
          schema: {
            type: 'object',
            properties: {
              business_details: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  mission_statement: { type: 'string' },
                  target_audience: { type: 'string' },
                  unique_selling_points: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  products: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  product_categories: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  price_range: { type: 'string' },
                  key_features: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['name', 'description']
              },
              shipping_incentives: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    policy: { type: 'string' },
                    free_shipping_tier: { type: 'string' },
                    threshold_amount: { type: 'string' },
                    delivery_timeframe: { type: 'string' }
                  }
                }
              },
              return_policy: {
                type: 'object',
                properties: {
                  return_window: { type: 'string' },
                  return_conditions: { type: 'string' },
                  refund_policy: { type: 'string' }
                }
              },
              customer_service: {
                type: 'object',
                properties: {
                  contact_methods: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  support_hours: { type: 'string' },
                  response_time: { type: 'string' }
                }
              },
              promotions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    offer_type: { type: 'string' },
                    description: { type: 'string' },
                    terms: { type: 'string' }
                  }
                }
              }
            },
            required: ['business_details', 'shipping_incentives']
          }
        }
      })
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeData.success) {
      console.error(`Firecrawl v1 failed for ${websiteUrl}:`, scrapeData.error);
      return {
        success: false,
        error: scrapeData.error,
        websiteUrl: websiteUrl,
        extractedData: {}
      };
    }

    return {
      success: true,
      websiteUrl: websiteUrl,
      extractedData: scrapeData.data?.json || {},
      metadata: scrapeData.data?.metadata || {},
      fullResponse: scrapeData
    };

  } catch (error) {
    console.error(`Firecrawl v1 error for ${websiteUrl}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
      websiteUrl: websiteUrl,
      extractedData: {}
    };
  }
}

// Discover Competitors with OpenAI using primary site analysis
async function discoverCompetitorsWithOpenAI(websiteUrl: string, primarySiteData: any): Promise<Competitor[]> {
  try {
    const businessData = primarySiteData?.extractedData?.business_details || {};
    
    const prompt = `Based on this e-commerce business profile, identify exactly 10 direct competitors:

Primary Business: ${websiteUrl}
Company: ${businessData.name || 'Unknown'}
Description: ${businessData.description || 'E-commerce business'}
Products: ${businessData.products?.join(', ') || 'Various products'}
Categories: ${businessData.product_categories?.join(', ') || 'Not specified'}
Target Audience: ${businessData.target_audience || 'General consumers'}
USPs: ${businessData.unique_selling_points?.join(', ') || 'Not specified'}

Return exactly 10 direct competitors in this JSON format:
[
  {
    "name": "Competitor Name",
    "website": "website.com",
    "products": "Brief description of their main products and market focus"
  }
]

Focus on direct competitors in the same industry with similar products, target market, and business model. Provide exact, working website URLs without https://.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const competitors = JSON.parse(jsonMatch[0]);
      return competitors.slice(0, 10); // Ensure exactly 10 competitors
    }
    
    return [];
  } catch (error) {
    console.error('OpenAI competitor discovery error:', error);
    return [];
  }
}

// Extract shipping threshold from shipping incentives
function extractShippingThreshold(shippingIncentives: any[]): number | null {
  if (!Array.isArray(shippingIncentives)) return null;

  for (const incentive of shippingIncentives) {
    const thresholdText = incentive.threshold_amount || incentive.free_shipping_tier || incentive.policy || '';
    
    // Look for dollar amounts
    const match = thresholdText.match(/\$(\d+(?:\.\d{2})?)/);
    if (match) {
      return parseFloat(match[1]);
    }
    
    // Check for "free shipping" with no threshold
    if (thresholdText.toLowerCase().includes('free') && 
        (thresholdText.toLowerCase().includes('all') || 
         thresholdText.toLowerCase().includes('everything') ||
         thresholdText.toLowerCase().includes('no minimum'))) {
      return 0;
    }
  }
  
  return null;
}

// Format shipping analysis for display
function formatShippingAnalysis(shippingIncentives: any[]): string {
  if (!Array.isArray(shippingIncentives) || shippingIncentives.length === 0) {
    return 'No shipping incentives found';
  }

  return shippingIncentives.map(incentive => {
    const parts = [];
    if (incentive.policy) parts.push(`Policy: ${incentive.policy}`);
    if (incentive.threshold_amount) parts.push(`Threshold: ${incentive.threshold_amount}`);
    if (incentive.delivery_timeframe) parts.push(`Delivery: ${incentive.delivery_timeframe}`);
    return parts.join(' | ');
  }).join('\n');
}

// Generate comprehensive competitive analysis report
async function generateComprehensiveReport(
  primaryUrl: string,
  primarySiteData: any,
  competitorData: Competitor[]
): Promise<{
  competitiveAnalysis: string;
  recommendations: string;
  avgThreshold: number;
}> {
  try {
    const primaryBusiness = primarySiteData?.extractedData?.business_details || {};
    const primaryShipping = primarySiteData?.extractedData?.shipping_incentives || [];
    
    // Calculate average threshold
    const validThresholds = competitorData
      .map(c => c.threshold)
      .filter(t => t !== null && t !== undefined) as number[];
    const avgThreshold = validThresholds.length > 0 
      ? validThresholds.reduce((sum, t) => sum + t, 0) / validThresholds.length 
      : 0;

    const analysisPrompt = `Generate a comprehensive competitive analysis report based on this business intelligence data:

PRIMARY BUSINESS ANALYSIS:
Company: ${primaryBusiness.name || primaryUrl}
Description: ${primaryBusiness.description || 'Not available'}
Mission: ${primaryBusiness.mission_statement || 'Not specified'}
Target Audience: ${primaryBusiness.target_audience || 'General consumers'}
Products: ${primaryBusiness.products?.join(', ') || 'Various products'}
Categories: ${primaryBusiness.product_categories?.join(', ') || 'Not specified'}
Price Range: ${primaryBusiness.price_range || 'Not specified'}
Key Features: ${primaryBusiness.key_features?.join(', ') || 'Not specified'}
Unique Selling Points: ${primaryBusiness.unique_selling_points?.join(', ') || 'Not specified'}

PRIMARY SHIPPING STRATEGY:
${primaryShipping.map(s => `${s.policy} - ${s.free_shipping_tier} (${s.threshold_amount || 'No threshold'})`).join('\n')}

COMPETITIVE LANDSCAPE:
${competitorData.map(c => `
${c.name} (${c.website}):
- Business: ${c.comprehensiveData?.business_details?.description || 'Business profile not available'}
- Products: ${c.comprehensiveData?.business_details?.products?.join(', ') || c.products}
- Price Range: ${c.comprehensiveData?.business_details?.price_range || 'Not specified'}
- Shipping: ${c.comprehensiveData?.shipping_incentives?.map(s => s.policy).join(', ') || 'No shipping data'}
- Threshold: ${c.threshold !== null ? `$${c.threshold}` : 'No free shipping or no threshold'}
- USPs: ${c.comprehensiveData?.business_details?.unique_selling_points?.join(', ') || 'Not available'}
`).join('\n')}

MARKET ANALYSIS:
Average Free Shipping Threshold: $${avgThreshold.toFixed(2)}
Total Competitors Analyzed: ${competitorData.length}

Provide a detailed competitive analysis covering:
1. **Business Positioning Analysis** - How does the primary business position itself vs competitors
2. **Product Portfolio Comparison** - Product range, categories, and differentiation
3. **Pricing Strategy Analysis** - Price positioning and competitive pricing
4. **Shipping Strategy Competitive Assessment** - Detailed shipping policy comparison
5. **Unique Value Propositions** - Key differentiators and competitive advantages
6. **Market Positioning Summary** - Overall competitive positioning and market opportunities

Format as a professional business analysis report with clear sections and actionable insights.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: analysisPrompt }],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const competitiveAnalysis = response.choices[0]?.message?.content || 'Analysis not available';

    // Generate recommendations
    const recommendationsPrompt = `Based on the competitive analysis data provided, generate specific strategic recommendations for ${primaryBusiness.name || primaryUrl}:

Current Position:
- Shipping Strategy: ${primaryShipping.map(s => s.policy).join(', ') || 'Not defined'}
- Average Competitor Threshold: $${avgThreshold.toFixed(2)}
- Business Focus: ${primaryBusiness.description || 'General e-commerce'}

Provide 5-7 specific, actionable recommendations covering:
1. Shipping strategy optimization
2. Competitive positioning improvements
3. Product portfolio enhancements
4. Customer experience improvements
5. Marketing and promotional strategies

Format as numbered recommendations with clear rationale for each.`;

    const recResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: recommendationsPrompt }],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const recommendations = recResponse.choices[0]?.message?.content || 'Recommendations not available';

    return {
      competitiveAnalysis,
      recommendations,
      avgThreshold
    };

  } catch (error) {
    console.error('Report generation error:', error);
    return {
      competitiveAnalysis: 'Competitive analysis unavailable due to API limitations',
      recommendations: 'Recommendations unavailable due to API limitations',
      avgThreshold: 0
    };
  }
}