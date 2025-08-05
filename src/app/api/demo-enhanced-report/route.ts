import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { website_url } = await request.json();

    if (!website_url) {
      return NextResponse.json({ 
        error: 'website_url is required' 
      }, { status: 400 });
    }

    // Mock comprehensive business data based on the enhanced Firecrawl extraction
    const primarySiteData = {
      business_details: {
        name: "Heirloom Jerky",
        description: "Gourmet brisket beef jerky that's always tender on your tongue but hard on flavor.",
        mission_statement: "We're on a mission to fill your mouth with the most tender, flavorful, bomb-ass beef jerky you've ever had. Every sack is packed with fresh takes on classic recipes so good, your mouth won't know what hit it.",
        target_audience: "Jerky lovers looking for high-quality, flavorful beef jerky.",
        unique_selling_points: [
          "Tender beef brisket jerky",
          "Bold, mouth-watering flavors", 
          "Fresh takes on classic recipes"
        ],
        products: [
          "BLAZED & GLAZED",
          "SAUCE SLINGER", 
          "HONEY BADGER",
          "The Jerky Threesome",
          "The Box Stuffer",
          "The Ultimate Flex"
        ],
        product_categories: ["Beef Jerky", "Gourmet Snacks"],
        price_range: "$22.99 - $1,034.55",
        key_features: [
          "Free CONUS Shipping on Everything",
          "High-quality ingredients",
          "Variety of flavors"
        ]
      },
      shipping_incentives: [{
        policy: "Free shipping on all orders within the continental United States (CONUS).",
        free_shipping_tier: "All orders qualify for free shipping.",
        threshold_amount: "N/A",
        delivery_timeframe: "Standard delivery timeframe not specified."
      }],
      return_policy: {
        return_window: "30 days",
        return_conditions: "Items must be unopened and in original condition.",
        refund_policy: "Full refund for returned items."
      },
      customer_service: {
        contact_methods: ["Contact form on website", "Social media channels"],
        support_hours: "Monday to Friday, 9 AM - 5 PM",
        response_time: "Typically within 24 hours"
      },
      promotions: [{
        offer_type: "Free Shipping",
        description: "Free CONUS Shipping on Everything!",
        terms: "Applicable to all orders."
      }]
    };

    // Mock competitor data with comprehensive business intelligence
    const competitorData = [
      {
        name: "Jack Link's",
        website: "jacklinks.com",
        threshold: 50,
        businessData: {
          business_details: {
            name: "Jack Link's",
            description: "America's #1 meat snack brand offering high-protein jerky and meat sticks.",
            mission_statement: "Feed Your Wild Side with bold flavors and protein-packed snacks.",
            target_audience: "Active lifestyle consumers and outdoor enthusiasts.",
            unique_selling_points: ["Market leader in jerky", "Wide retail distribution", "Iconic brand recognition"],
            products: ["Original Beef Jerky", "Teriyaki Beef Jerky", "Meat Sticks", "Wild Side"],
            product_categories: ["Beef Jerky", "Meat Sticks", "Snack Foods"],
            price_range: "$4.99 - $39.99",
            key_features: ["High protein content", "No MSG", "National brand recognition"]
          },
          shipping_incentives: [{
            policy: "Free shipping on orders over $50",
            free_shipping_tier: "Orders $50+",
            threshold_amount: "$50.00",
            delivery_timeframe: "5-7 business days"
          }]
        },
        shippingAnalysis: "Policy: Free shipping on orders over $50 | Threshold: $50.00 | Delivery: 5-7 business days"
      },
      {
        name: "Krave Jerky",
        website: "kravejerky.com",
        threshold: 35,
        businessData: {
          business_details: {
            name: "Krave Jerky",
            description: "Premium gourmet jerky with chef-inspired flavors and clean ingredients.",
            mission_statement: "Elevate the jerky experience with gourmet flavors and quality ingredients.",
            target_audience: "Health-conscious consumers seeking premium snack options.",
            unique_selling_points: ["Gourmet flavors", "Clean ingredients", "Chef-inspired recipes"],
            products: ["Chili Lime Beef", "Garlic Chili Pepper Turkey", "Sweet Chipotle Beef"],
            product_categories: ["Gourmet Jerky", "Premium Snacks"],
            price_range: "$8.99 - $49.99",
            key_features: ["No artificial preservatives", "Gluten-free options", "Premium packaging"]
          },
          shipping_incentives: [{
            policy: "Free shipping on orders over $35",
            free_shipping_tier: "Orders $35+", 
            threshold_amount: "$35.00",
            delivery_timeframe: "3-5 business days"
          }]
        },
        shippingAnalysis: "Policy: Free shipping on orders over $35 | Threshold: $35.00 | Delivery: 3-5 business days"
      },
      {
        name: "Country Archer",
        website: "countryarcher.com",
        threshold: 0,
        businessData: {
          business_details: {
            name: "Country Archer",
            description: "Grass-fed, natural jerky and meat sticks with no antibiotics or hormones.",
            mission_statement: "Provide clean, sustainable protein snacks from grass-fed animals.",
            target_audience: "Health-conscious consumers focused on clean eating and sustainability.",
            unique_selling_points: ["Grass-fed beef", "No antibiotics/hormones", "Sustainable sourcing"],
            products: ["Grass Fed Beef Jerky", "Zero Sugar Jerky", "Mini Meat Sticks"],
            product_categories: ["Grass-Fed Jerky", "Zero Sugar Snacks", "Mini Sticks"],
            price_range: "$6.99 - $59.99",
            key_features: ["Grass-fed", "No added sugar options", "Keto-friendly"]
          },
          shipping_incentives: [{
            policy: "Free shipping on all orders",
            free_shipping_tier: "All orders qualify",
            threshold_amount: "N/A",
            delivery_timeframe: "4-6 business days"
          }]
        },
        shippingAnalysis: "Policy: Free shipping on all orders | Threshold: N/A | Delivery: 4-6 business days"
      }
    ];

    // Generate comprehensive business analysis using the enhanced data
    const businessAnalysis = `
## **Business Positioning Analysis**

**Primary Business Profile:**
- **Company:** ${primarySiteData.business_details.name}
- **Market Position:** Premium gourmet jerky focused on tender brisket with bold flavors
- **Target Audience:** ${primarySiteData.business_details.target_audience}
- **Price Range:** ${primarySiteData.business_details.price_range} (premium positioning)
- **Mission:** ${primarySiteData.business_details.mission_statement}

**Competitive Landscape Overview:**
The jerky market spans from mass-market leaders like Jack Link's to premium artisanal brands. Heirloom Jerky positions itself in the premium segment with unique brisket-focused offerings and aggressive free shipping (no minimum threshold).

## **Product Portfolio Comparison**

**Product Differentiation:**
- **Heirloom Jerky:** Specializes exclusively in beef brisket jerky with creative flavor profiles
- **Jack Link's:** Broad portfolio across beef jerky, meat sticks, and snack foods with market-leading distribution
- **Krave Jerky:** Gourmet chef-inspired flavors with clean ingredient focus
- **Country Archer:** Grass-fed, sustainable protein with zero sugar options

**Category Analysis:**
Most competitors focus on traditional beef jerky, while Heirloom Jerky's brisket specialization creates unique positioning in the premium segment.

## **Pricing Strategy Analysis**

**Market Positioning by Price:**
- **Premium Tier:** Heirloom Jerky ($22.99-$1,034.55) - Ultra-premium with gift sets
- **Mid-Premium:** Krave Jerky ($8.99-$49.99) - Gourmet positioning
- **Mass Premium:** Country Archer ($6.99-$59.99) - Clean/sustainable focus  
- **Mass Market:** Jack Link's ($4.99-$39.99) - Volume/accessibility focus

Heirloom Jerky commands the highest price points, justified by artisanal positioning and brisket specialization.

## **Shipping Strategy Competitive Assessment**

**Free Shipping Threshold Analysis:**
- **$0 Threshold (Ultra-Competitive):** Heirloom Jerky, Country Archer
- **$35 Threshold (Competitive):** Krave Jerky
- **$50 Threshold (Standard):** Jack Link's
- **Market Average:** $28.33

**Competitive Advantage:** Heirloom Jerky's zero-threshold free CONUS shipping provides significant competitive advantage, especially for premium pricing strategy.

## **Unique Value Propositions**

**Key Differentiators by Brand:**
- **Heirloom Jerky:** Tender brisket specialization + zero shipping threshold + bold flavor innovation
- **Jack Link's:** Market leadership + broad availability + brand recognition
- **Krave Jerky:** Gourmet flavors + clean ingredients + chef inspiration
- **Country Archer:** Grass-fed sustainability + zero sugar options + ethical sourcing

## **Market Positioning Summary**

Heirloom Jerky occupies a unique position as the premium brisket specialist with customer-friendly shipping. While competitors focus on traditional jerky or broad portfolios, Heirloom's brisket focus and aggressive shipping policy create defensible competitive advantages in the high-end market segment.

**Key Opportunity:** The combination of premium positioning, unique product focus, and customer-friendly shipping creates a compelling value proposition that differentiates from both mass-market and gourmet competitors.
    `;

    const recommendations = `
## **Strategic Recommendations for Heirloom Jerky**

**1. Leverage Shipping Advantage in Marketing**
Prominently feature "Free CONUS Shipping on Everything" as a key differentiator, especially against competitors with $35-50 thresholds. This removes purchase barriers for premium-priced products.

**2. Expand Brisket Innovation**
Build on the unique brisket positioning with limited edition flavors and seasonal offerings. The specialization creates authentic differentiation in a crowded market.

**3. Develop Gift Market Strategy** 
The price range extending to $1,034.55 suggests strong gift positioning. Create targeted campaigns for corporate gifts, holidays, and special occasions where premium jerky serves as luxury items.

**4. Emphasize Quality Storytelling**
Use the artisanal mission statement and "fresh takes on classic recipes" positioning to justify premium pricing through authentic brand storytelling and ingredient transparency.

**5. Consider Subscription Service**
With zero shipping threshold advantage, develop monthly jerky subscriptions to increase customer lifetime value and create predictable revenue streams.

**6. Selective Retail Partnerships**
While maintaining direct-to-consumer focus, consider premium retail placements (specialty stores, high-end grocers) that align with brand positioning and pricing strategy.

**7. Customer Experience Enhancement**
Improve return policy communication and customer service details to match the premium positioning. Clear policies build trust for high-priced purchases.
    `;

    // Calculate metrics for compatibility with existing report system
    const thresholds = competitorData.map(c => c.threshold);
    const avgThreshold = thresholds.reduce((sum, t) => sum + t, 0) / thresholds.length;
    const primaryThreshold = 0; // Free shipping on everything

    const response = {
      success: true,
      message: `Enhanced business analysis demo completed for ${website_url}`,
      reportData: {
        websiteUrl: website_url,
        businessAnalysis: businessAnalysis,
        competitorCount: competitorData.length,
        avgThreshold: avgThreshold.toFixed(2),
        thresholds: thresholds,
        primaryThreshold: primaryThreshold,
        primarySiteData: primarySiteData,
        competitors: competitorData,
        recommendations: recommendations,
        reportType: 'enhanced-demo-analysis'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Demo report error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate demo report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}