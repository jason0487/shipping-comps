'use client';

import React, { useState } from 'react';

// Mock data for testing
const mockAnalysisResult = {
  business_analysis: `Industry: Athletic apparel and fitness accessories
  
Product Focus: Premium workout gear, activewear, and athletic accessories targeting fitness enthusiasts

Target Market: Health-conscious consumers, athletes, and fitness professionals aged 25-45

Key Differentiators: High-quality materials, innovative designs, performance-focused features

Global Reach: Domestic shipping focus with international options

Brand Appeal: Premium positioning with emphasis on performance and style`,
  
  user_shipping: {
    threshold: 75,
    policy: "Free shipping on orders over $75. Standard delivery 3-5 business days."
  },
  
  competitors: [
    {
      name: 'Nike',
      website: 'www.nike.com',
      products: 'Athletic apparel, footwear, and accessories',
      shipping_incentives: 'Free shipping on orders $50+. Nike+ members get free shipping on all orders. Express shipping available for $5.'
    },
    {
      name: 'Adidas',
      website: 'www.adidas.com', 
      products: 'Sports clothing, shoes, and equipment',
      shipping_incentives: 'Free standard shipping on orders $50+. adiClub members get free shipping on all orders. Next-day delivery available in select areas.'
    },
    {
      name: 'Under Armour',
      website: 'www.underarmour.com',
      products: 'Performance apparel, footwear, and accessories',
      shipping_incentives: 'Free shipping on orders $50+. UA HOVR connected shoes include free shipping. 2-day shipping available for $8.'
    },
    {
      name: 'Lululemon',
      website: 'www.lululemon.com',
      products: 'Premium athletic wear and yoga apparel',
      shipping_incentives: 'Free shipping on orders $128+. Complimentary hemming service. Express shipping for $15.'
    }
  ]
};

const calculateCompetitiveGrade = (userShipping: any, competitors: any[]) => {
  if (!userShipping?.threshold && !competitors?.length) return { grade: 'C', color: '#f59e0b' };
  
  const competitorThresholds = competitors
    .map(comp => {
      const match = comp.shipping_incentives?.match(/\$(\d+)/);
      return match ? parseInt(match[1]) : null;
    })
    .filter(Boolean);
  
  if (competitorThresholds.length === 0) return { grade: 'C', color: '#f59e0b' };
  
  const avgThreshold = competitorThresholds.reduce((a, b) => a + b, 0) / competitorThresholds.length;
  const userThreshold = userShipping?.threshold || 999;
  
  if (userThreshold <= avgThreshold * 0.7) return { grade: 'A+', color: '#10b981' };
  if (userThreshold <= avgThreshold) return { grade: 'A-', color: '#10b981' };
  if (userThreshold <= avgThreshold * 1.3) return { grade: 'B+', color: '#3b82f6' };
  if (userThreshold <= avgThreshold * 1.6) return { grade: 'B-', color: '#6366f1' };
  if (userThreshold <= avgThreshold * 2) return { grade: 'C+', color: '#f59e0b' };
  if (userThreshold <= avgThreshold * 2.5) return { grade: 'C-', color: '#f59e0b' };
  if (userThreshold <= avgThreshold * 3) return { grade: 'D+', color: '#ef4444' };
  return { grade: 'F', color: '#dc2626' };
};

const generateRecommendations = (analysisResult: any) => {
  const competitors = analysisResult.competitors || [];
  const userThreshold = analysisResult.user_shipping?.threshold || 0;
  
  const competitorThresholds = competitors
    .map((comp: any) => {
      const match = comp.shipping_incentives?.match(/\$(\d+)/);
      return match ? parseInt(match[1]) : null;
    })
    .filter(Boolean);
  
  const avgThreshold = competitorThresholds.length > 0 
    ? competitorThresholds.reduce((a, b) => a + b, 0) / competitorThresholds.length 
    : 75;
  
  const highlyCompetitive = Math.max(25, Math.floor(avgThreshold * 0.7));  // 30% below average
  const moderatelyCompetitive = Math.max(25, Math.floor(avgThreshold * 0.85)); // 15% below average
  const lowCompetitive = Math.max(25, Math.floor(avgThreshold * 1.0)); // Match average
  
  return {
    thresholdOptions: {
      highly: { amount: highlyCompetitive, description: "Highly Competitive - Undercut competitors significantly" },
      moderate: { amount: moderatelyCompetitive, description: "Moderately Competitive - Stay competitive while maintaining margins" },
      low: { amount: lowCompetitive, description: "Low Competitive - Match market average" }
    },
    avgThreshold: Math.round(avgThreshold),
    policies: [
      'Offer 30-day return window to match industry standards',
      'Provide expedited shipping options (2-3 day delivery)',
      'Include order tracking and delivery notifications',
      'Consider same-day delivery for local customers'
    ],
    actionPlan: [
      {
        phase: 'Week 1',
        actions: [
          `Choose and implement your preferred threshold option (highly competitive: $${highlyCompetitive}, moderate: $${moderatelyCompetitive}, or low competitive: $${lowCompetitive})`,
          'Review and optimize current shipping carrier contracts',
          'Implement shipping calculator on product pages'
        ]
      },
      {
        phase: 'Week 2-3', 
        actions: [
          'A/B test shipping threshold messaging',
          'Add expedited shipping options at checkout',
          'Create shipping policy FAQ page'
        ]
      },
      {
        phase: 'Month 2-3',
        actions: [
          'Implement automated shipping rules',
          'Add real-time shipping rates',
          'Optimize packaging for cost efficiency',
          'Monitor conversion rate improvements'
        ]
      }
    ]
  };
};

export default function TestActionPlan() {
  const [websiteUrl, setWebsiteUrl] = useState('www.example-fitness-store.com');
  const [showReport, setShowReport] = useState(false);
  
  const grade = calculateCompetitiveGrade(mockAnalysisResult.user_shipping, mockAnalysisResult.competitors);
  const recommendations = generateRecommendations(mockAnalysisResult);

  const generateEmailHTML = () => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Your Shipping Action Plan</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; font-size: 14px; }
            .container { max-width: 800px; margin: 0 auto; padding: 0; }
            .header { background: #1A1A1A; color: white; padding: 40px; text-align: center; }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 0; font-size: 16px; color: #999; }
            .content { background: #ffffff; padding: 40px; }
            .grade { font-size: 48px; font-weight: bold; margin: 20px 0; }
            .section { margin: 30px 0; padding: 0; }
            .section h3 { margin: 0 0 15px 0; color: #2d3748; font-size: 20px; font-weight: 600; }
            .section p { font-size: 14px; margin: 10px 0; }
            .action-plan .phase { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #3182ce; }
            .phase h4 { margin: 0 0 10px 0; color: #2d3748; font-size: 16px; font-weight: 600; }
            ul { padding-left: 20px; margin: 10px 0; }
            li { margin: 8px 0; font-size: 14px; }
            .cta-section { background: #FFFCF6; padding: 40px; margin: 40px 0; text-align: center; }
            .cta-button { display: inline-block; background: #1A1A1A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 15px 0; }
            .deliveri-logo { max-width: 150px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Your Personalized Shipping Action Plan</h1>
                <p>Competitive analysis and recommendations for ${websiteUrl}</p>
            </div>
            
            <div class="content">
                <div class="section">
                    <h3>Your Competitive Shipping Grade</h3>
                    <div class="grade" style="color: ${grade.color};">${grade.grade}</div>
                    <p>Based on analysis of ${mockAnalysisResult.competitors?.length || 0} competitors in your industry.</p>
                </div>

                <div class="section">
                    <h3>🎯 Recommended Shipping Threshold Options</h3>
                    <p style="margin-bottom: 20px; color: #666;">Choose your competitive strategy based on your business goals:</p>
                    
                    <div style="border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f0fdf4;">
                        <h4 style="color: #16a34a; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">💪 Highly Competitive: $${recommendations.thresholdOptions.highly.amount}</h4>
                        <p style="margin: 0; font-size: 14px; color: #15803d;">${recommendations.thresholdOptions.highly.description}</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">${Math.round(((recommendations.avgThreshold - recommendations.thresholdOptions.highly.amount) / recommendations.avgThreshold) * 100)}% below competitor average of $${recommendations.avgThreshold}</p>
                    </div>
                    
                    <div style="border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 15px 0; background: #fffbeb;">
                        <h4 style="color: #f59e0b; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">⚖️ Moderately Competitive: $${recommendations.thresholdOptions.moderate.amount}</h4>
                        <p style="margin: 0; font-size: 14px; color: #d97706;">${recommendations.thresholdOptions.moderate.description}</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">${Math.round(((recommendations.avgThreshold - recommendations.thresholdOptions.moderate.amount) / recommendations.avgThreshold) * 100)}% below competitor average of $${recommendations.avgThreshold}</p>
                    </div>
                    
                    <div style="border: 2px solid #6b7280; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f9fafb;">
                        <h4 style="color: #6b7280; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">🎯 Low Competitive: $${recommendations.thresholdOptions.low.amount}</h4>
                        <p style="margin: 0; font-size: 14px; color: #4b5563;">${recommendations.thresholdOptions.low.description}</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Matches competitor average of $${recommendations.avgThreshold}</p>
                    </div>
                </div>

                <div class="section">
                    <h3>📋 Suggested Shipping Policies</h3>
                    <ul>
                        ${recommendations.policies.map(policy => `<li>${policy}</li>`).join('')}
                    </ul>
                </div>

                <div class="section action-plan">
                    <h3>🚀 Implementation Action Plan</h3>
                    ${recommendations.actionPlan.map(phase => `
                        <div class="phase">
                            <h4>${phase.phase}</h4>
                            <ul>
                                ${phase.actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>

                <div class="cta-section">
                    <h2>Ready to Optimize Your Shipping?</h2>
                    <div style="text-align: center; margin: 20px 0;">
                        <img src="/images/deliveri-logo.png" alt="Deliveri" style="max-width: 150px; height: auto; display: block; margin: 0 auto;"/>
                    </div>
                    <p><strong>Deliveri can help you with:</strong></p>
                    <ul style="text-align: center; display: inline-block; list-style: none; padding: 0;">
                        <li style="margin: 8px 0;">• Multi-carrier shipping optimization</li>
                        <li style="margin: 8px 0;">• Real-time rate shopping</li>
                        <li style="margin: 8px 0;">• Automated shipping rules</li>
                        <li style="margin: 8px 0;">• Upfront Duties and Taxes</li>
                        <li style="margin: 8px 0;">• Shipping Insurance</li>
                        <li style="margin: 8px 0;">• Integration with your e-commerce platform (Shopify, Etsy, etc.)</li>
                    </ul>
                    <p><strong>Schedule a free consultation to discuss your shipping strategy!</strong></p>
                    <a href="https://www.ondeliveri.com/bookademo" class="cta-button">Book Your Free Demo</a>
                    <p style="font-size: 14px; color: #666; margin-top: 20px;">
                        Simply reply to this email or visit www.ondeliveri.com/bookademo
                    </p>
                </div>

                <div class="footer">
                    <p>This report was generated by Shipping Comps - AI-powered competitor analysis for e-commerce shipping strategies.</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Background image overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30 -z-10"
        style={{
          backgroundImage: "url('/images/backround-image-radial.png')",
          backgroundSize: '150% 100%'
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <a href="/">
            <img 
              src="/images/deliveri-labs-logo.png" 
              alt="Deliveri Labs" 
              className="h-16 w-auto cursor-pointer"
            />
          </a>
          <nav className="flex items-center space-x-6">
            <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
          </nav>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Action Plan Report Test Page
          </h1>
          <p className="text-xl text-center text-gray-600 mb-8">
            Preview the personalized shipping action plan report
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuration</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL (for email context)
              </label>
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="www.your-store.com"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowReport(!showReport)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {showReport ? 'Hide' : 'Show'} Email Preview
              </button>
              
              <button
                onClick={() => {
                  const htmlContent = generateEmailHTML();
                  const blob = new Blob([htmlContent], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'action-plan-report.html';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Download HTML
              </button>
            </div>
          </div>

          {/* Email Preview */}
          {showReport && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Report Preview</h2>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="email-preview"
                  dangerouslySetInnerHTML={{ __html: generateEmailHTML() }}
                  style={{ 
                    maxHeight: '800px', 
                    overflowY: 'auto',
                    background: '#f5f5f5',
                    padding: '20px'
                  }}
                />
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Report Details:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Competitive Grade: <span style={{color: grade.color}} className="font-bold">{grade.grade}</span></li>
                  <li>• User Threshold: ${mockAnalysisResult.user_shipping.threshold}</li>
                  <li>• Competitors Analyzed: {mockAnalysisResult.competitors.length}</li>
                  <li>• Recommended Threshold: {recommendations.thresholdRecommendation}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}