import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize AI services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Competitor {
  name: string;
  website: string;
  products: string;
  shippingData?: any;
  threshold?: number | null;
}

interface ShippingAnalysis {
  threshold: number | null;
  standardShipping: string;
  expressOptions: string;
  geographicCoverage: string;
  promotionalOffers: string;
  uniqueDifferentiators: string;
}

export async function POST(request: NextRequest) {
  try {
    const { website_url } = await request.json();

    if (!website_url) {
      return NextResponse.json({ 
        error: 'website_url is required' 
      }, { status: 400 });
    }

    console.log(`Starting unified AI pipeline analysis for: ${website_url}`);

    // Stage 1: Business Analysis & Competitor Discovery (OpenAI)
    console.log('Stage 1: OpenAI business analysis and competitor discovery...');
    const { businessAnalysis, competitors } = await discoverCompetitorsWithOpenAI(website_url);

    // Stage 2: Comprehensive Data Collection (Firecrawl)
    console.log('Stage 2: Firecrawl data collection...');
    const primarySiteData = await crawlSiteWithFirecrawl(website_url);
    const competitorData = await Promise.all(
      competitors.slice(0, 5).map(async (competitor) => {
        const data = await crawlSiteWithFirecrawl(competitor.website);
        return {
          ...competitor,
          shippingData: data,
          threshold: extractShippingThreshold(data)
        };
      })
    );

    // Stage 3: Professional Report Generation (OpenAI)
    console.log('Stage 3: OpenAI report generation...');
    const { competitiveAnalysis, recommendations, avgThreshold } = await generateReportWithOpenAI(
      website_url,
      businessAnalysis,
      primarySiteData,
      competitorData
    );

    // Calculate thresholds for compatibility with current system
    const thresholds = competitorData.map(c => c.threshold || 0);
    const primaryThreshold = extractShippingThreshold(primarySiteData);

    const response = {
      success: true,
      message: `Unified AI pipeline analysis completed for ${website_url}`,
      reportData: {
        websiteUrl: website_url,
        businessAnalysis: competitiveAnalysis,
        competitorCount: competitorData.length,
        avgThreshold: avgThreshold.toFixed(2),
        thresholds: thresholds,
        primaryThreshold: primaryThreshold,
        competitors: competitorData.map(c => ({
          name: c.name,
          website: c.website,
          threshold: c.threshold,
          shippingAnalysis: formatShippingData(c.shippingData)
        })),
        recommendations: recommendations,
        reportType: 'poc-unified',
        crawlData: {
          primarySite: primarySiteData,
          competitorSites: competitorData.map(c => c.shippingData)
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unified AI pipeline error:', error);
    return NextResponse.json({ 
      error: 'Failed to complete unified analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Stage 1: OpenAI Business Analysis & Competitor Discovery
async function discoverCompetitorsWithOpenAI(websiteUrl: string): Promise<{
  businessAnalysis: string;
  competitors: Competitor[];
}> {
  try {
    // First, get basic website content for analysis
    const siteContent = await getBasicSiteContent(websiteUrl);
    
    const prompt = `Analyze this e-commerce website and identify direct competitors:

Website: ${websiteUrl}
Content Preview: ${siteContent.substring(0, 3000)}

Please provide:
1. Business analysis (industry, products, target market, positioning)
2. 8 direct competitors with their exact website URLs

Return response in this JSON format:
{
  "businessAnalysis": "Detailed business analysis covering industry, products, target market, and positioning",
  "competitors": [
    {
      "name": "Competitor Name",
      "website": "exact-website-url.com",
      "products": "Brief description of their main products and focus"
    }
  ]
}

Focus on direct competitors in the same industry with similar products and target market. Provide exact, working website URLs.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        businessAnalysis: result.businessAnalysis || 'Business analysis not available',
        competitors: result.competitors || []
      };
    }
    
    return {
      businessAnalysis: 'Business analysis not available',
      competitors: []
    };
  } catch (error) {
    console.error('OpenAI competitor discovery error:', error);
    return {
      businessAnalysis: 'Business analysis unavailable due to API limitations',
      competitors: []
    };
  }
}

// Basic site content fetching for OpenAI analysis
async function getBasicSiteContent(url: string): Promise<string> {
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
    
    // Basic text extraction
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return textContent.substring(0, 5000);
  } catch (error) {
    console.error('Basic content fetch error:', error);
    return '';
  }
}

// Stage 2: Firecrawl Comprehensive Data Collection  
async function crawlSiteWithFirecrawl(websiteUrl: string): Promise<any> {
  try {
    console.log(`Firecrawl: Starting analysis for ${websiteUrl}`);
    
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl;
    }

    // Direct API call to Firecrawl for comprehensive shipping data extraction
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: websiteUrl,
        extractorOptions: {
          mode: 'llm-extraction',
          extractionSchema: {
            type: 'object',
            properties: {
              shipping_threshold: {
                type: 'string',
                description: 'Free shipping threshold amount (e.g., $99, $50, or "No threshold" if free shipping always, or "No free shipping" if not offered)'
              },
              standard_shipping: {
                type: 'string', 
                description: 'Standard shipping cost and timeframe (e.g., "$8.95, 3-5 business days")'
              },
              express_options: {
                type: 'string',
                description: 'Express or expedited shipping options available with costs and timeframes'
              },
              geographic_coverage: {
                type: 'string',
                description: 'Geographic areas covered for shipping (domestic, international, specific regions)'
              },
              promotional_offers: {
                type: 'string',
                description: 'Any special shipping promotions, member benefits, or seasonal offers'
              },
              unique_policies: {
                type: 'string',
                description: 'Any unique shipping policies, restrictions, or special conditions'
              }
            }
          }
        },
        formats: ['markdown']
      })
    });

    const scrapeData = await scrapeResponse.json();
    
    // Try to get shipping-specific page if homepage didn't have enough info
    let shippingPageData = null;
    if (scrapeData?.data?.llm_extraction?.shipping_threshold?.includes('Not specified') ||
        scrapeData?.data?.llm_extraction?.shipping_threshold?.includes('not mentioned')) {
      
      console.log(`Trying dedicated shipping page for ${websiteUrl}`);
      try {
        const shippingUrl = `${websiteUrl}/shipping`;
        const shippingResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: shippingUrl,
            extractorOptions: {
              mode: 'llm-extraction',
              extractionSchema: {
                type: 'object',
                properties: {
                  shipping_threshold: {
                    type: 'string',
                    description: 'Free shipping threshold amount'
                  },
                  shipping_details: {
                    type: 'string',
                    description: 'Complete shipping policy details'
                  }
                }
              }
            },
            formats: ['markdown']
          })
        });
        
        shippingPageData = await shippingResponse.json();
      } catch (shippingError) {
        console.log('Shipping page scrape failed:', shippingError);
      }
    }
    
    console.log(`Firecrawl: Completed analysis for ${websiteUrl}`);
    
    return {
      success: true,
      websiteUrl: websiteUrl,
      mainPageData: scrapeData?.data || {},
      shippingPageData: shippingPageData?.data || null,
      extractedInfo: scrapeData?.data?.llm_extraction || {},
      markdown: scrapeData?.data?.markdown || '',
      returnCode: scrapeData?.returnCode || scrapeResponse.status
    };

  } catch (error) {
    console.error(`Firecrawl error for ${websiteUrl}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Crawl failed',
      websiteUrl: websiteUrl,
      extractedInfo: {}
    };
  }
}

// Stage 3: OpenAI Professional Report Generation
async function generateReportWithOpenAI(
  primaryUrl: string,
  businessAnalysis: string,
  primarySiteData: any,
  competitorData: Competitor[]
): Promise<{
  competitiveAnalysis: string;
  recommendations: string;
  avgThreshold: number;
}> {
  try {
    // Prepare comprehensive data for Claude analysis
    const analysisData = {
      primaryWebsite: {
        url: primaryUrl,
        businessProfile: businessAnalysis,
        shippingData: primarySiteData,
        extractedPages: primarySiteData.pages?.length || 0
      },
      competitors: competitorData.map(c => ({
        name: c.name,
        website: c.website,
        products: c.products,
        shippingData: c.shippingData,
        threshold: c.threshold,
        extractedPages: c.shippingData?.pages?.length || 0
      }))
    };

    const prompt = `As a professional e-commerce consultant, analyze this comprehensive shipping data and create a strategic competitor analysis report.

Primary Website Analysis:
${JSON.stringify(analysisData.primaryWebsite, null, 2)}

Competitor Analysis Data:
${JSON.stringify(analysisData.competitors, null, 2)}

Create a professional analysis that includes:

1. **Business Context & Market Position**: Brief overview of the primary website's position in the market
2. **Competitive Shipping Landscape**: Analysis of how competitors structure their shipping policies
3. **Threshold Analysis**: Specific shipping threshold insights and market positioning
4. **Strategic Opportunities**: Actionable recommendations based on competitive gaps
5. **Implementation Priorities**: Specific next steps for shipping strategy optimization

Format the response as a comprehensive business analysis that maintains professional tone while being actionable and specific. Focus on concrete insights derived from the actual shipping data collected.

Write in a professional, consultant-style tone similar to a McKinsey or BCG analysis - authoritative, data-driven, and actionable.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const competitiveAnalysis = response.choices[0]?.message?.content || 'Competitive analysis unavailable';

    // Generate actionable recommendations
    const recommendationsPrompt = `Based on the competitive shipping analysis, provide specific, actionable recommendations for ${primaryUrl}. 

Focus on:
1. Immediate shipping policy adjustments (this week)
2. Strategic positioning improvements (30 days)  
3. Long-term competitive advantages (90 days)

Keep recommendations specific, measurable, and implementable. Format as clear action items.`;

    const recResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: recommendationsPrompt }],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const recommendations = recResponse.choices[0]?.message?.content || 'Recommendations unavailable';

    // Calculate average threshold
    const validThresholds = competitorData
      .map(c => c.threshold)
      .filter(t => t !== null && t !== undefined && t > 0) as number[];
    
    const avgThreshold = validThresholds.length > 0 
      ? validThresholds.reduce((a, b) => a + b, 0) / validThresholds.length
      : 0;

    return {
      competitiveAnalysis,
      recommendations,
      avgThreshold
    };

  } catch (error) {
    console.error('Claude report generation error:', error);
    return {
      competitiveAnalysis: 'Competitive analysis unavailable due to API limitations',
      recommendations: 'Recommendations unavailable due to API limitations',
      avgThreshold: 0
    };
  }
}

// Extract shipping threshold from Firecrawl data
function extractShippingThreshold(firecrawlData: any): number | null {
  // Check extracted info first
  const extractedThreshold = firecrawlData?.extractedInfo?.shipping_threshold || 
                            firecrawlData?.mainPageData?.llm_extraction?.shipping_threshold ||
                            firecrawlData?.shippingPageData?.llm_extraction?.shipping_threshold;
  
  if (extractedThreshold) {
    // Extract numeric value from threshold string
    const thresholdMatch = extractedThreshold.match(/\$?(\d+)/);
    if (thresholdMatch) {
      const threshold = parseInt(thresholdMatch[1]);
      if (threshold > 0 && threshold <= 500) {
        return threshold;
      }
    }
    
    // Check for "free shipping" with no threshold
    if (extractedThreshold.toLowerCase().includes('no threshold') ||
        extractedThreshold.toLowerCase().includes('always free') ||
        (extractedThreshold.toLowerCase().includes('free') && !extractedThreshold.match(/\$\d+/))) {
      return 0;
    }
  }
  
  // Fallback to markdown content analysis
  const markdown = firecrawlData?.markdown || '';
  const thresholdPatterns = [
    /free shipping.*?[\$](\d+)/i,
    /[\$](\d+).*?free shipping/i,
    /orders over [\$](\d+)/i,
    /minimum [\$](\d+)/i,
    /spend [\$](\d+)/i,
    /(\d+)\s*dollars.*?free shipping/i
  ];

  for (const pattern of thresholdPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const threshold = parseInt(match[1]);
      if (threshold > 0 && threshold <= 500) {
        return threshold;
      }
    }
  }

  return null;
}

// Format shipping data for display
function formatShippingData(firecrawlData: any): string {
  if (!firecrawlData?.extractedInfo) return 'No shipping data available';
  
  const extracted = firecrawlData.extractedInfo;
  const parts = [];
  
  if (extracted.shipping_threshold) {
    parts.push(`Threshold: ${extracted.shipping_threshold}`);
  }
  
  if (extracted.standard_shipping) {
    parts.push(`Standard: ${extracted.standard_shipping}`);
  }
  
  if (extracted.express_options) {
    parts.push(`Express: ${extracted.express_options}`);
  }
  
  if (extracted.geographic_coverage) {
    parts.push(`Coverage: ${extracted.geographic_coverage}`);
  }
  
  if (extracted.promotional_offers) {
    parts.push(`Promotions: ${extracted.promotional_offers}`);
  }
  
  if (extracted.unique_policies) {
    parts.push(`Special: ${extracted.unique_policies}`);
  }
  
  return parts.length > 0 ? parts.join('\n') : 'No structured shipping data extracted';
}