import OpenAI from 'openai'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const perplexityApiKey = process.env.PERPLEXITY_API_KEY

export async function scrapeWebsite(url: string): Promise<string | null> {
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove script and style elements
    $('script, style, nav, footer, header').remove()

    // Extract text content
    const text = $('body').text()
    return text.replace(/\s+/g, ' ').trim().substring(0, 15000)
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return null
  }
}

export async function analyzeEcommerceSite(websiteContent: string): Promise<string> {
  try {
    const prompt = `Analyze this e-commerce website content and provide a structured business analysis.

Website Content:
${websiteContent}

Please provide a comprehensive analysis with the following structure:

**Industry:** [Industry/category]
**Product Focus:** [Main product categories and offerings]
**Target Market:** [Primary customer demographics and segments]
**Key Differentiators:** [Unique selling propositions and competitive advantages]
**Global Reach:** [Geographic markets and international presence]
**Brand Appeal:** [Brand positioning and customer appeal factors]

Format as structured text with clear sections and bullet points where appropriate. Be specific and focus on business characteristics that would help identify similar competitors.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7
    })

    return response.choices[0]?.message?.content || "Analysis not available"
  } catch (error) {
    console.error('Error analyzing ecommerce site:', error)
    throw error
  }
}

export async function findCompetitors(siteAnalysis: string, originalUrl: string): Promise<any[]> {
  try {
    const prompt = `Based on this e-commerce business analysis, find 10 direct competitors that sell similar products to similar customers.

Business Analysis:
${siteAnalysis}

Please provide exactly 10 competitors in this JSON format:
[
  {
    "name": "Competitor Name",
    "website": "https://website.com", 
    "products": "Brief description of their main products"
  }
]

Focus on:
- Direct competitors with similar product categories
- Companies targeting similar customer segments  
- Well-known brands in the same industry
- Mix of large and medium-sized competitors
- Actual websites that exist and are accessible

Return only the JSON array, no additional text.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.8
    })

    const content = response.choices[0]?.message?.content || "[]"
    
    try {
      const competitors = JSON.parse(content)
      return Array.isArray(competitors) ? competitors.slice(0, 10) : []
    } catch (parseError) {
      console.error('Error parsing competitors JSON:', parseError)
      return []
    }
  } catch (error) {
    console.error('Error finding competitors:', error)
    throw error
  }
}

export async function analyzeShippingIncentives(websiteUrl: string, storeName: string): Promise<string> {
  try {
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not configured')
    }

    const prompt = `Analyze the current shipping incentives and policies for ${storeName} at ${websiteUrl}.

Focus on finding:
- Free shipping thresholds and minimum order amounts
- Standard delivery options and timeframes  
- Express or expedited shipping options
- Special shipping promotions or incentives
- Return shipping policies
- International shipping availability

Provide a structured summary of their current shipping strategy with specific details about thresholds, costs, and delivery options. Focus on actionable competitive intelligence.`

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json() as any
    const content = data.choices?.[0]?.message?.content || 'Shipping information not available'
    
    // Clean up the shipping text
    return content
      .replace(/\*+/g, '')
      .replace(/#/g, '')
      .replace(/\[\d+\]/g, '')
      .trim()
  } catch (error) {
    console.error(`Error analyzing shipping for ${storeName}:`, error)
    return `Free shipping: Information not available\nStandard delivery: Contact store for details\nExpress options: Check website for current offers`
  }
}