import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { website_url } = await request.json();

    if (!website_url) {
      return NextResponse.json({ 
        error: 'website_url is required' 
      }, { status: 400 });
    }

    console.log(`Testing Firecrawl for: ${website_url}`);

    let url = website_url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Direct API call to Firecrawl with corrected format
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        extractorOptions: {
          mode: 'llm-extraction',
          extractionSchema: {
            type: 'object',
            properties: {
              shipping_threshold: {
                type: 'string',
                description: 'Free shipping threshold amount (e.g., $99, $50, or "No threshold" if free shipping always)'
              },
              standard_shipping: {
                type: 'string', 
                description: 'Standard shipping cost and timeframe'
              },
              express_options: {
                type: 'string',
                description: 'Express or expedited shipping options available'
              },
              geographic_coverage: {
                type: 'string',
                description: 'Geographic areas covered for shipping'
              },
              promotional_offers: {
                type: 'string',
                description: 'Any special shipping promotions or member benefits'
              }
            }
          }
        },
        formats: ['markdown']
      })
    });

    const scrapeData = await scrapeResponse.json();
    console.log('Firecrawl scrape response:', scrapeData);

    return NextResponse.json({
      success: true,
      message: `Firecrawl test completed for ${website_url}`,
      data: {
        websiteUrl: website_url,
        scrapedContent: scrapeData,
        extractedInfo: scrapeData?.data?.extract || 'No extraction available',
        markdown: scrapeData?.data?.markdown || 'No markdown available',
        status: scrapeResponse.status
      }
    });

  } catch (error) {
    console.error('Firecrawl test error:', error);
    return NextResponse.json({ 
      error: 'Firecrawl test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}