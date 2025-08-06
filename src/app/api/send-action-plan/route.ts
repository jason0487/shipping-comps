import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name, websiteUrl, analysisResult } = await request.json();

    if (!email || !analysisResult) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate competitive grade based on user's shipping vs competitors
    const calculateCompetitiveGrade = (userShipping: any, competitors: any[]) => {
      // Check if user already offers free shipping with no threshold (optimal strategy)
      const userThreshold = userShipping?.threshold;
      const hasUserFreeShipping = userShipping?.policy?.toLowerCase().includes('free') || userThreshold === 0;
      
      // If user offers free shipping on all orders (no threshold), they have the best possible shipping strategy
      if (hasUserFreeShipping && userThreshold === 0) {
        return { 
          grade: 'A+', 
          color: '#16a34a',
          message: 'Excellent! You already offer the best shipping incentive - free shipping on all orders.',
          isOptimal: true
        };
      }
      
      const competitorThresholds = competitors
        .map(comp => {
          const match = comp.shipping_incentives?.match(/\$(\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter(Boolean);
      
      // If no competitor data, return moderate grade
      if (competitorThresholds.length === 0) {
        return { 
          grade: 'B', 
          color: '#84cc16',
          message: 'Limited competitor data available for comparison.'
        };
      }
      
      const avgThreshold = competitorThresholds.reduce((a, b) => a + b, 0) / competitorThresholds.length;
      const currentThreshold = userThreshold || 999;
      
      if (currentThreshold <= avgThreshold * 0.7) return { grade: 'A+', color: '#16a34a', message: 'Highly competitive shipping strategy!' }; 
      if (currentThreshold <= avgThreshold) return { grade: 'A-', color: '#16a34a', message: 'Strong competitive position in shipping.' }; 
      if (currentThreshold <= avgThreshold * 1.3) return { grade: 'B+', color: '#84cc16', message: 'Good shipping strategy with room for improvement.' }; 
      if (currentThreshold <= avgThreshold * 1.6) return { grade: 'B-', color: '#84cc16', message: 'Moderate shipping competitiveness.' }; 
      if (currentThreshold <= avgThreshold * 2) return { grade: 'C+', color: '#eab308', message: 'Shipping strategy needs improvement.' }; 
      if (currentThreshold <= avgThreshold * 2.5) return { grade: 'C-', color: '#eab308', message: 'Below average shipping competitiveness.' }; 
      if (currentThreshold <= avgThreshold * 3) return { grade: 'D+', color: '#f97316', message: 'Shipping strategy significantly behind competitors.' }; 
      return { grade: 'F', color: '#ef4444', message: 'Shipping strategy needs major improvement.' }; 
    };

    const grade = calculateCompetitiveGrade(analysisResult.user_shipping, analysisResult.competitors);
    
    // Generate recommendations based on analysis
    const generateRecommendations = () => {
      const competitors = analysisResult.competitors || [];
      const userThreshold = analysisResult.user_shipping?.threshold;
      const userPolicy = analysisResult.user_shipping?.policy || '';
      
      // Check if user already has optimal shipping (free shipping, no threshold)
      const hasOptimalShipping = userThreshold === 0 && userPolicy.toLowerCase().includes('free');
      
      const competitorThresholds = competitors
        .map(comp => {
          const match = comp.shipping_incentives?.match(/\$(\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter(Boolean);
      
      const avgThreshold = competitorThresholds.length > 0 
        ? competitorThresholds.reduce((a, b) => a + b, 0) / competitorThresholds.length 
        : 75;
      
      // If user already has optimal shipping, focus on maintaining advantage
      if (hasOptimalShipping) {
        return {
          currentStatus: {
            message: `🎉 Excellent! You already offer free shipping on all orders with no minimum threshold. This is the most competitive shipping strategy possible.`,
            policy: userPolicy,
            isOptimal: true
          },
          thresholdOptions: {
            maintain: { 
              amount: 0, 
              description: "Maintain Current Strategy - You're already offering the best possible shipping incentive",
              recommendation: "Continue offering free shipping on all orders to maintain your competitive advantage"
            }
          },
          avgThreshold: Math.round(avgThreshold),
          policies: [
            'Continue offering free shipping on all orders to maintain competitive advantage',
            'Consider highlighting your free shipping prominently on your website',
            'Ensure shipping costs are properly factored into product pricing',
            'Explore ways to optimize shipping costs while maintaining free shipping'
          ],
          actionPlan: [
            {
              phase: 'Immediate',
              actions: [
                'Verify free shipping is prominently displayed on your website',
                'Ensure product pricing accounts for shipping costs',
                'Review shipping carrier contracts for cost optimization'
              ]
            },
            {
              phase: 'Week 1-2',
              actions: [
                'Add free shipping messaging to product pages and checkout',
                'Consider expedited shipping options as paid upgrades',
                'Monitor shipping cost margins and adjust pricing if needed'
              ]
            },
            {
              phase: 'Month 1-2',
              actions: [
                'Analyze shipping cost impact on margins',
                'Explore bulk shipping discounts with carriers',
                'Consider regional shipping optimization',
                'Test messaging around your shipping advantage in marketing'
              ]
            }
          ]
        };
      }
      
      // Standard recommendations for businesses without optimal shipping
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

    const recommendations = generateRecommendations();
    
    // Calculate gauge position based on grade
    const getGaugePosition = (gradeValue) => {
      const positions = {
        'A+': 0, 'A-': 0.15, 'B+': 0.35, 'B-': 0.5, 
        'C+': 0.65, 'C-': 0.8, 'D+': 0.9, 'F': 1
      };
      return positions[gradeValue] || 0.5;
    };
    
    const gaugePosition = getGaugePosition(grade.grade);
    const needleX = 60 + 25 * Math.cos((gaugePosition * Math.PI) - Math.PI);
    const needleY = 50 + 25 * Math.sin((gaugePosition * Math.PI) - Math.PI);
    
    // Create HTML email content
    const htmlContent = `
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
                <p style="color: white;">Competitive analysis and recommendations for ${websiteUrl}</p>
            </div>
            
            <div class="content">
                <div style="background: #f8f9fa; padding: 32px; margin: 0; border-radius: 8px;">
                    <div style="font-size: 24px; margin-bottom: 20px;">
                        <span style="color: #9ca3af; font-weight: 400;">Your Competitive</span> <span style="color: #000; font-weight: 600;">Shipping Grade</span>
                    </div>
                    <div style="font-size: 64px; font-weight: bold; color: ${grade.color}; line-height: 1; margin-bottom: 12px;">${grade.grade}</div>
                    <div style="font-size: 16px; color: #6b7280;">Based on analysis of ${analysisResult.competitors?.length || 0} competitors</div>
                    ${grade.message ? `<div style="font-size: 16px; color: #333; font-weight: 500; margin-top: 15px; padding: 15px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 4px;">${grade.message}</div>` : ''}
                    ${grade.isOptimal ? `<div style="font-size: 14px; color: #16a34a; margin-top: 10px; font-weight: 600;">✅ You're already offering the most competitive shipping strategy!</div>` : ''}
                </div>

                ${recommendations.currentStatus ? `
                <div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #16a34a; margin-top: 0; font-size: 20px;">Current Shipping Status</h3>
                    <p style="margin: 10px 0; font-size: 16px; color: #333;">${recommendations.currentStatus.message}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>Your Policy:</strong> ${recommendations.currentStatus.policy}</p>
                </div>
                ` : ''}

                <div class="section">
                    <h3>🎯 ${recommendations.currentStatus ? 'Maintain Your Competitive Advantage' : 'Recommended Shipping Threshold Options'}</h3>
                    <p style="margin-bottom: 20px; color: #666;">${recommendations.currentStatus ? 'Focus on optimizing your existing free shipping strategy:' : 'Choose your competitive strategy based on your business goals:'}</p>
                    
                    ${recommendations.thresholdOptions.maintain ? `
                    <div style="border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f0fdf4;">
                        <h4 style="color: #16a34a; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">🏆 ${recommendations.thresholdOptions.maintain.description}</h4>
                        <p style="margin: 0; font-size: 14px; color: #15803d;">${recommendations.thresholdOptions.maintain.recommendation}</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">You're already offering the optimal shipping incentive - better than ${recommendations.avgThreshold > 0 ? `$${recommendations.avgThreshold} competitor average` : 'most competitors'}</p>
                    </div>
                    ` : `
                    <div style="border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f0fdf4;">
                        <h4 style="color: #16a34a; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">💪 Highly Competitive: $${recommendations.thresholdOptions.highly.amount}</h4>
                        <p style="margin: 0; font-size: 14px; color: #15803d;">${recommendations.thresholdOptions.highly.description}</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">${recommendations.avgThreshold > 0 ? Math.round(((recommendations.avgThreshold - recommendations.thresholdOptions.highly.amount) / recommendations.avgThreshold) * 100) : 0}% below competitor average of $${recommendations.avgThreshold}</p>
                    </div>
                    
                    <div style="border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 15px 0; background: #fffbeb;">
                        <h4 style="color: #f59e0b; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">⚖️ Moderately Competitive: $${recommendations.thresholdOptions.moderate.amount}</h4>
                        <p style="margin: 0; font-size: 14px; color: #d97706;">${recommendations.thresholdOptions.moderate.description}</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">${recommendations.avgThreshold > 0 ? Math.round(((recommendations.avgThreshold - recommendations.thresholdOptions.moderate.amount) / recommendations.avgThreshold) * 100) : 0}% below competitor average of $${recommendations.avgThreshold}</p>
                    </div>
                    
                    <div style="border: 2px solid #6b7280; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f9fafb;">
                        <h4 style="color: #6b7280; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">🎯 Low Competitive: $${recommendations.thresholdOptions.low.amount}</h4>
                        <p style="margin: 0; font-size: 14px; color: #4b5563;">${recommendations.thresholdOptions.low.description}</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Matches competitor average of $${recommendations.avgThreshold}</p>
                    </div>
                    `}
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
                        <img src="https://raw.githubusercontent.com/brownje07/shipping-comps-next/main/public/images/deliveri-logo.png" alt="Deliveri" style="max-width: 150px; height: auto; display: block; margin: 0 auto;" onerror="this.style.display='none'"/>
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

    // Create HubSpot lead (non-blocking)
    try {
      await createHubSpotLead({
        email: email,
        name: name,
        website_url: websiteUrl,
        analysis_data: analysisResult
      });
    } catch (hubspotError) {
      console.log('HubSpot lead creation failed (non-critical):', hubspotError);
    }

    // Send email using fetch to SendGrid API
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    const emailData = {
      personalizations: [
        {
          to: [{ email: email }],
          subject: 'Your Personalized Shipping Action Plan'
        }
      ],
      from: {
        email: 'yourcustomreport@ondeliveri.com',
        name: 'Shipping Comps by Deliveri Labs'
      },
      content: [
        {
          type: 'text/html',
          value: htmlContent
        }
      ]
    };

    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('SendGrid error response:', errorText);
      console.error('SendGrid error status:', emailResponse.status);
      console.error('SendGrid error headers:', emailResponse.headers);
      throw new Error(`SendGrid API error: ${emailResponse.status} - ${errorText}`);
    }

    return NextResponse.json({ success: true, message: 'Action plan sent successfully' });

  } catch (error) {
    console.error('Error sending action plan:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        error: 'Failed to send action plan',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        errorType: error.name || 'Unknown'
      },
      { status: 500 }
    );
  }
}

// HubSpot lead creation function
async function createHubSpotLead(leadData: {
  email: string;
  name?: string;
  website_url?: string;
  analysis_data?: any;
}): Promise<boolean> {
  const hubspotApiKey = process.env.HUBSPOT_API_KEY;
  
  if (!hubspotApiKey) {
    console.log('HubSpot API key not configured');
    return false;
  }

  try {
    // Extract analysis data
    const analysisData = leadData.analysis_data || {};
    const competitors = analysisData.competitors || [];
    const businessAnalysis = analysisData.business_analysis || '';
    
    // Extract company name from website URL if not provided
    let companyName = '';
    if (leadData.website_url) {
      companyName = leadData.website_url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('.')[0];
    }

    // Extract industry from business analysis
    let industry = 'E-commerce';
    if (businessAnalysis.includes('Industry:')) {
      const industryMatch = businessAnalysis.match(/Industry:\s*([^\n]+)/i);
      if (industryMatch) {
        industry = industryMatch[1].trim();
      }
    }

    // Format analysis date
    const analysisDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Create HubSpot contact
    const contactData = {
      properties: {
        email: leadData.email,
        firstname: leadData.name || leadData.email.split('@')[0],
        company: companyName,
        website: leadData.website_url || '',
        lifecyclestage: 'lead',
        hs_lead_status: 'NEW',
        source: 'Shipping Comps Analysis',
        hs_analytics_source: 'OFFLINE',
        // Custom properties for competitor analysis
        competitor_count: competitors.length.toString(),
        analysis_timestamp: analysisDate,
        industry_segment: industry,
        lead_quality_score: competitors.length >= 5 ? 'High' : 'Medium',
        follow_up_priority: 'High'
      }
    };

    console.log('Sending contact data to HubSpot:', contactData);

    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('HubSpot contact created:', result.id);
      return true;
    } else {
      const errorText = await response.text();
      console.error('HubSpot API error:', response.status, errorText);
      return false;
    }

  } catch (error) {
    console.error('Error creating HubSpot lead:', error);
    return false;
  }
}