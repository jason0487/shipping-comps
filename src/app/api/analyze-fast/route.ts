import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

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

function getPerplexityApiKey() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY environment variable is missing');
  }
  return apiKey;
}

interface Competitor {
  name: string;
  website: string;
  products: string;
  shipping_incentives: string;
}

// Ultra-fast scraping with reduced timeout for production
async function quickScrapeWebsite(url: string): Promise<string> {
  try {
    console.log(`Quick scraping: ${url}`);
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const perplexityApiKey = getPerplexityApiKey();
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{
            role: 'user',
            content: `Analyze ${url} and provide: 1) What they sell 2) Target market 3) Key differentiators. Keep response under 500 words.`
          }],
          max_tokens: 800,
          temperature: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error(`Quick scraping failed for ${url}:`, error);
    throw error;
  }
}

// Find competitors with enhanced processing
async function findQuickCompetitors(businessAnalysis: string): Promise<string[]> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: `Based on this business analysis: "${businessAnalysis.slice(0, 800)}"
        
Please identify 6 direct competitor websites that offer similar products/services. Focus on well-known brands in the same industry.

List the competitor websites as URLs only, one per line:
https://competitor1.com
https://competitor2.com
https://competitor3.com
https://competitor4.com
https://competitor5.com
https://competitor6.com`
      }],
      max_tokens: 300,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content || '';
    const urls = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('http'))
      .slice(0, 6); // Increased to 6 competitors

    return urls;
  } catch (error) {
    console.error('Competitor finding error:', error);
    return [];
  }
}

// Enhanced competitor analysis matching original format
async function quickCompetitorAnalysis(competitorUrl: string): Promise<{ name: string; products: string; shipping: string } | null> {
  try {
    console.log(`Enhanced competitor analysis: ${competitorUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000); // 18 second timeout

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{
            role: 'user',
            content: `Analyze the website ${competitorUrl} and provide current shipping incentives and policies. Focus on:

1. Free shipping thresholds
2. Shipping speeds and options  
3. Special shipping promotions
4. Express or expedited shipping
5. Member benefits or programs

Format as shipping incentives only, using bullet points with clear details. Be specific about dollar amounts, timeframes, and conditions.`
          }],
          max_tokens: 400,
          temperature: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const shippingAnalysis = data.choices?.[0]?.message?.content || '';
      
      // Get basic info about the company
      const openai = getOpenAIClient();
      const infoResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Based on the website ${competitorUrl}, provide:
1. Company name (just the brand name, not the URL)
2. Brief product description (what they sell in 1-2 lines)

Format:
NAME: [company name]
PRODUCTS: [product description]`
        }],
        max_tokens: 150,
        temperature: 0.3
      });

      const info = infoResponse.choices[0]?.message?.content || '';
      const nameMatch = info.match(/NAME:\s*(.+)/i);
      const productsMatch = info.match(/PRODUCTS:\s*(.+)/i);
      
      return {
        name: nameMatch?.[1]?.trim() || competitorUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0],
        products: productsMatch?.[1]?.trim() || 'Various products and services',
        shipping: shippingAnalysis
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error(`Enhanced competitor analysis failed for ${competitorUrl}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('=== FAST ANALYSIS START ===');
  
  try {
    const openai = getOpenAIClient();
    const supabaseAdmin = getSupabaseClient();
    const { url, userId } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    console.log(`Fast analysis for: ${url}, userId: ${userId}`);

    // Step 1: Quick website scraping (20s max)
    console.log('Step 1: Quick website scraping...');
    const websiteContent = await quickScrapeWebsite(url);
    console.log(`Scraped in ${Date.now() - startTime}ms`);

    // Step 2: Enhanced business analysis
    console.log('Step 2: Enhanced business analysis...');
    const businessResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: `Analyze this business comprehensively: "${websiteContent.slice(0, 1500)}"

Please provide a detailed analysis including:

**Industry**: What industry/sector they operate in
**Product Focus**: 
- Key Product Categories: Main product types they offer
- Specific Product Types: Detailed product listings
- Target Products: Products they focus on

**Target Market**:
- Primary Demographics: Who they serve
- Customer Segments: Different customer types
- Market Positioning: How they position themselves

**Key Differentiators**:
- Unique Selling Points: What makes them special
- Competitive Advantages: How they beat competitors
- Special Features: Unique offerings or capabilities

Format with clear headers and bullet points. Be comprehensive but concise.`
      }],
      max_tokens: 800,
      temperature: 0.1
    });

    const businessAnalysis = businessResponse.choices[0]?.message?.content || '';
    console.log(`Business analysis completed in ${Date.now() - startTime}ms`);

    // Step 2b: Create condensed business summary
    console.log('Creating condensed business summary...');
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: `Based on this analysis: "${businessAnalysis}"
        
Create a condensed 2-3 sentence business summary focusing on:
1. What industry they're in
2. Their main products/services
3. Their key competitive advantage

Keep it concise and informative.`
      }],
      max_tokens: 200,
      temperature: 0.1
    });

    const businessSummary = summaryResponse.choices[0]?.message?.content || '';
    console.log(`Business summary completed in ${Date.now() - startTime}ms`);

    // Step 3: Find competitors (5s max)
    console.log('Step 3: Finding competitors...');
    const competitorUrls = await findQuickCompetitors(businessAnalysis);
    console.log(`Found ${competitorUrls.length} competitors in ${Date.now() - startTime}ms`);

    // Step 4: Quick competitor analysis (15s max total)
    console.log('Step 4: Quick competitor analysis...');
    const competitorPromises = competitorUrls.map(url => quickCompetitorAnalysis(url));
    const competitorResults = await Promise.allSettled(competitorPromises);
    
    const validCompetitors = competitorResults
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => {
        const competitor = (result as PromiseFulfilledResult<any>).value;
        return {
          name: competitor.name,
          website: competitor.name,
          products: competitor.products,
          shipping_incentives: competitor.shipping
        };
      });

    const totalTime = Date.now() - startTime;
    console.log(`=== FAST ANALYSIS COMPLETE in ${totalTime}ms ===`);

    // Save to database if user provided
    if (userId) {
      try {
        await supabaseAdmin
          .from('analysis_history')
          .insert({
            user_id: userId,
            website_url: url,
            analysis_type: 'fast_competitor_analysis',
            competitor_count: validCompetitors.length,
            status: 'completed',
            business_analysis: businessAnalysis,
            competitors_data: validCompetitors,
          });
        console.log('Saved fast analysis to database');
      } catch (dbError) {
        console.error('Database save error:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      business_analysis: businessAnalysis,
      business_summary: businessSummary,
      competitors: validCompetitors,
      user_shipping: null,
      analysis_time_ms: totalTime,
      analysis_id: null
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Fast analysis failed after ${totalTime}ms:`, error);
    
    return NextResponse.json({
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      analysis_time_ms: totalTime
    }, { status: 500 });
  }
}