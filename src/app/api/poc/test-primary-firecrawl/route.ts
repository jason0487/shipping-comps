import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { website_url } = await request.json();
    
    if (!website_url) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    console.log(`Testing Primary Firecrawl for: ${website_url}`);
    
    // Clean and format URL
    let cleanUrl = website_url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    console.log(`Cleaned URL: ${cleanUrl}`);

    // Use Firecrawl v1 scrape endpoint with JSON extraction (similar to playground)
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: cleanUrl,
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
    console.log('Firecrawl v1 scrape response:', JSON.stringify(scrapeData, null, 2));

    if (!scrapeData.success) {
      return NextResponse.json({
        success: false,
        error: scrapeData.error || 'Firecrawl v1 scrape failed',
        url: cleanUrl,
        fullResponse: scrapeData
      });
    }

    // V1 scrape with JSON extraction returns data directly
    const extractedData = scrapeData.data?.json || {};

    return NextResponse.json({
      success: true,
      url: cleanUrl,
      extractedData: extractedData,
      markdown: scrapeData.data?.markdown || '',
      fullResponse: scrapeData
    });

  } catch (error) {
    console.error('Primary Firecrawl test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}