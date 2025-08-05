import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI
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

export async function POST(request: NextRequest) {
  try {
    const { website_url } = await request.json();

    if (!website_url) {
      return NextResponse.json({ 
        error: 'website_url is required' 
      }, { status: 400 });
    }

    console.log(`Starting OpenAI + Firecrawl pipeline analysis for: ${website_url}`);

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
      message: `OpenAI + Firecrawl pipeline analysis completed for ${website_url}`,
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
          shippingAnalysis: formatShippingData(c.shippingData),
          rawFirecrawlData: c.shippingData?.extractedInfo || {}
        })),
        recommendations: recommendations,
        reportType: 'poc-openai-firecrawl',
        crawlData: {
          primarySite: primarySiteData,
          competitorSites: competitorData.map(c => c.shippingData)
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('OpenAI + Firecrawl pipeline error:', error);
    return NextResponse.json({ 
      error: 'Failed to complete analysis',
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

// Stage 2: Firecrawl Comprehensive Multi-Page Data Collection  
async function crawlSiteWithFirecrawl(websiteUrl: string): Promise<any> {
  try {
    console.log(`Firecrawl: Starting comprehensive multi-page analysis for ${websiteUrl}`);
    
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl;
    }

    // Use Firecrawl's crawl endpoint to analyze multiple pages including shipping/policy pages
    const crawlResponse = await fetch('https://api.firecrawl.dev/v0/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: websiteUrl,
        crawlerOptions: {
          includes: ['**/shipping**', '**/delivery**', '**/policy**', '**/policies**', '**/faq**', '**/help**', '/', '**/about**'],
          excludes: ['**/blog**', '**/news**', '**/press**', '**/careers**', '**/contact**', '**/login**', '**/register**', '**/cart**', '**/checkout**'],
          maxDepth: 2,
          limit: 10,
          allowBackwardCrawling: false,
          allowExternalContentLinks: false
        },
        pageOptions: {
          extractorOptions: {
            mode: 'llm-extraction',
            extractionPrompt: 'Extract shipping incentives, policies, and free shipping tiers. Include details about the business and what they sell. Provide a summary of the findings.',
            extractionSchema: {
              type: 'object',
              properties: {
                shipping_incentives: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      description: { type: 'string' },
                      conditions: { type: 'string' }
                    }
                  }
                },
                shipping_policies: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      policy_name: { type: 'string' },
                      details: { type: 'string' }
                    }
                  }
                },
                free_shipping_tiers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      tier_name: { type: 'string' },
                      minimum_purchase: { type: 'number' }
                    }
                  }
                },
                business_details: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    products: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                },
                summary: { type: 'string' }
              },
              required: ['shipping_incentives', 'shipping_policies', 'free_shipping_tiers', 'business_details', 'summary']
            }
          },
          formats: ['markdown']
        }
      })
    });

    const crawlData = await crawlResponse.json();
    
    if (!crawlData.success) {
      console.log(`Firecrawl crawl failed, falling back to single page scrape for ${websiteUrl}`);
      return await fallbackSinglePageScrape(websiteUrl);
    }

    // Wait for crawl to complete
    const jobId = crawlData.jobId;
    console.log(`Firecrawl: Crawl job ${jobId} started, waiting for completion...`);
    
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 5 minutes
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const statusResponse = await fetch(`https://api.firecrawl.dev/v0/crawl/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        }
      });
      
      const statusData = await statusResponse.json();
      
      if (statusData.status === 'completed') {
        console.log(`Firecrawl: Crawl completed for ${websiteUrl} - found ${statusData.data?.length || 0} pages`);
        
        // Combine all extracted data from different pages
        const combinedData = combineMultiPageData(statusData.data || []);
        
        return {
          success: true,
          websiteUrl: websiteUrl,
          crawlJobId: jobId,
          pagesAnalyzed: statusData.data?.length || 0,
          mainPageData: statusData.data?.[0] || {},
          extractedInfo: combinedData,
          allPagesData: statusData.data || [],
          returnCode: 200
        };
      } else if (statusData.status === 'failed') {
        console.log(`Firecrawl: Crawl failed for ${websiteUrl}, falling back to single page`);
        return await fallbackSinglePageScrape(websiteUrl);
      }
      
      attempts++;
      console.log(`Firecrawl: Crawl in progress for ${websiteUrl} (attempt ${attempts}/${maxAttempts})`);
    }
    
    // Timeout - fallback to single page
    console.log(`Firecrawl: Crawl timeout for ${websiteUrl}, falling back to single page`);
    return await fallbackSinglePageScrape(websiteUrl);

  } catch (error) {
    console.error(`Firecrawl crawl error for ${websiteUrl}:`, error);
    return await fallbackSinglePageScrape(websiteUrl);
  }
}

// Fallback to single page scrape if crawl fails
async function fallbackSinglePageScrape(websiteUrl: string): Promise<any> {
  try {
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
          extractionPrompt: 'Extract shipping incentives, policies, and free shipping tiers. Include details about the business and what they sell. Provide a summary of the findings.',
          extractionSchema: {
            type: 'object',
            properties: {
              shipping_incentives: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    conditions: { type: 'string' }
                  }
                }
              },
              shipping_policies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    policy_name: { type: 'string' },
                    details: { type: 'string' }
                  }
                }
              },
              free_shipping_tiers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    tier_name: { type: 'string' },
                    minimum_purchase: { type: 'number' }
                  }
                }
              },
              business_details: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  products: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              },
              summary: { type: 'string' }
            },
            required: ['shipping_incentives', 'shipping_policies', 'free_shipping_tiers', 'business_details', 'summary']
          }
        },
        formats: ['markdown']
      })
    });

    const scrapeData = await scrapeResponse.json();
    
    return {
      success: true,
      websiteUrl: websiteUrl,
      mainPageData: scrapeData?.data || {},
      extractedInfo: scrapeData?.data?.llm_extraction || {},
      markdown: scrapeData?.data?.markdown || '',
      returnCode: scrapeData?.returnCode || scrapeResponse.status,
      fallback: true
    };
  } catch (error) {
    console.error(`Firecrawl fallback error for ${websiteUrl}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Crawl failed',
      websiteUrl: websiteUrl,
      extractedInfo: {}
    };
  }
}

// Combine extracted data from multiple pages
function combineMultiPageData(pagesData: any[]): any {
  const combined = {
    shipping_threshold: '',
    standard_shipping: '',
    express_options: '',
    geographic_coverage: '',
    promotional_offers: '',
    unique_policies: '',
    free_shipping_details: ''
  };
  
  const sources: string[] = [];
  
  pagesData.forEach((page, index) => {
    const extracted = page?.llm_extraction || {};
    const pageUrl = page?.metadata?.sourceURL || `Page ${index + 1}`;
    
    Object.keys(combined).forEach(key => {
      if (extracted[key] && extracted[key].trim() && !combined[key].includes(extracted[key])) {
        if (combined[key]) {
          combined[key] += ` | ${extracted[key]}`;
        } else {
          combined[key] = extracted[key];
        }
        
        if (!sources.includes(pageUrl)) {
          sources.push(pageUrl);
        }
      }
    });
  });
  
  // Add source information
  combined['data_sources'] = sources.join(', ');
  combined['pages_analyzed'] = pagesData.length;
  
  return combined;
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
    // Prepare comprehensive data for OpenAI analysis
    const analysisData = {
      primaryWebsite: {
        url: primaryUrl,
        businessProfile: businessAnalysis,
        shippingData: primarySiteData.extractedInfo,
        threshold: extractShippingThreshold(primarySiteData)
      },
      competitors: competitorData.map(c => ({
        name: c.name,
        website: c.website,
        products: c.products,
        shippingData: c.shippingData?.extractedInfo || {},
        threshold: c.threshold
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

Write in a professional, consultant-style tone - authoritative, data-driven, and actionable.`;

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
    console.error('OpenAI report generation error:', error);
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
                            firecrawlData?.mainPageData?.llm_extraction?.shipping_threshold;
  
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