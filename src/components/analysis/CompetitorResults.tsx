import { useState } from 'react';

interface CompetitorResultsProps {
  data: {
    business_analysis?: string;
    user_shipping?: {
      analysis: string;
      threshold: number | null;
    };
    competitors?: Array<{
      name: string;
      website: string;
      products: string;
      shipping_incentives?: string;
      comprehensiveData?: {
        shipping_info?: {
          has_free_shipping?: boolean;
          free_shipping_conditions?: string;
          shipping_thresholds?: string;
          regional_shipping_notes?: string;
          shipping_incentives?: string;
          general_shipping_policy?: string;
          raw_shipping_snippets?: string[];
        };
        business_description?: string;
        business_summary?: string;
      };
      threshold?: number | null;
      businessData?: any;
      shippingAnalysis?: string;
    }>;
  };
  websiteUrl?: string;
}

// Helper function to extract threshold and shipping info from competitor data
function extractShippingInfo(competitor: any): { threshold: number | null; type: string; displayText: string; hasShipping: boolean } {
  const comprehensiveData = competitor.comprehensiveData || competitor.businessData;
  
  // First try comprehensive data from Firecrawl
  if (comprehensiveData?.shipping_info) {
    const shippingInfo = comprehensiveData.shipping_info;
    const conditions = shippingInfo.free_shipping_conditions || '';
    const thresholds = shippingInfo.shipping_thresholds || '';
    const policy = shippingInfo.general_shipping_policy || '';
    const hasShipping = shippingInfo.has_free_shipping;
    
    // If explicitly no free shipping, don't show threshold bar
    if (hasShipping === false) {
      return { threshold: null, type: 'no_free_shipping', displayText: policy || 'No free shipping offered', hasShipping: false };
    }
    
    // Look for threshold in conditions text
    const allText = `${conditions} ${thresholds} ${policy}`.toLowerCase();
    
    // Check for "free shipping on all orders" or similar (threshold = 0)
    if (allText.includes('free shipping on all orders') ||
        allText.includes('free standard shipping on all orders') ||
        (allText.includes('free') && allText.includes('all orders'))) {
      return { threshold: 0, type: 'free', displayText: conditions || policy || 'Free shipping', hasShipping: true };
    }
    
    // Look for threshold patterns
    const thresholdPatterns = [
      /free\s+shipping\s+(?:on|for)\s+orders?\s+(?:over|above)\s*\$(\d+(?:\.\d{2})?)/i,
      /orders?\s+(?:over|above)\s*\$(\d+(?:\.\d{2})?)\s*(?:qualify|get|receive)?\s*free\s*shipping/i,
      /\$(\d+(?:\.\d{2})?)\s*(?:or\s+)?(?:more|above)\s*(?:free\s*shipping|ships?\s*free)/i
    ];
    
    for (const pattern of thresholdPatterns) {
      const match = allText.match(pattern);
      if (match) {
        const threshold = parseFloat(match[1]);
        return { threshold, type: 'threshold', displayText: `$${threshold}+ for free shipping`, hasShipping: true };
      }
    }
    
    // If has_free_shipping is true but no clear threshold found, assume free shipping
    if (hasShipping === true) {
      return { threshold: 0, type: 'free', displayText: conditions || policy || 'Free shipping', hasShipping: true };
    }
    
    // If shipping info exists but unclear, don't show threshold bar
    if (policy || conditions) {
      return { threshold: null, type: 'unclear', displayText: policy || conditions || 'Shipping policy available', hasShipping: false };
    }
  }
  
  // Try direct threshold if available
  if (competitor.threshold !== null && competitor.threshold !== undefined) {
    const threshold = competitor.threshold;
    if (threshold === 0) {
      return { threshold: 0, type: 'free', displayText: 'Free shipping', hasShipping: true };
    }
    if (threshold > 0) {
      return { threshold, type: 'threshold', displayText: `$${threshold}+ for free shipping`, hasShipping: true };
    }
  }
  
  // Legacy fallback - check old shipping_incentives field
  const shippingText = competitor.shipping_incentives || competitor.shippingAnalysis || '';
  if (shippingText) {
    const lowerText = shippingText.toLowerCase();
    
    // Check if text indicates no free shipping or unspecified shipping
    if (lowerText.includes('not specified') || 
        lowerText.includes('no free shipping') ||
        lowerText.includes('no shipping data') ||
        (lowerText.includes('shipping is available') && !lowerText.includes('free'))) {
      return { threshold: null, type: 'no_shipping_data', displayText: 'Shipping policy not specified', hasShipping: false };
    }
    
    // Look for patterns that indicate free shipping thresholds
    const freeShippingPatterns = [
      /free\s+shipping\s+(?:on|for)\s+orders?\s+(?:over|above|\$)[\s$]*(\d+(?:\.\d{2})?)/i,
      /orders?\s+(?:over|above)\s*\$(\d+(?:\.\d{2})?)\s*(?:qualify|get|receive)?\s*free\s*shipping/i,
      /\$(\d+(?:\.\d{2})?)\s*(?:or\s+)?(?:more|above)\s*(?:free\s*shipping|ships?\s*free)/i,
      /free\s*shipping\s*threshold[:\s]*\$?(\d+(?:\.\d{2})?)/i
    ];
    
    for (const pattern of freeShippingPatterns) {
      const match = shippingText.match(pattern);
      if (match) {
        const threshold = parseFloat(match[1]);
        return { threshold, type: 'threshold', displayText: `$${threshold}+ for free shipping`, hasShipping: true };
      }
    }
    
    // Check for "free shipping on all orders" (threshold = 0)
    if (lowerText.includes('free shipping on all orders') ||
        lowerText.includes('free standard shipping') ||
        (lowerText.includes('free shipping') && lowerText.includes('all orders'))) {
      return { threshold: 0, type: 'free', displayText: 'Free shipping', hasShipping: true };
    }
  }
  
  // No shipping data found
  return { threshold: null, type: 'unknown', displayText: 'Shipping policy not specified', hasShipping: false };
}

// Helper function to extract threshold from competitor (for compatibility)
function extractThreshold(competitor: any): number | null {
  return extractShippingInfo(competitor).threshold;
}

// Helper function to format shipping incentives
function formatShippingIncentives(incentives: string): string[] {
  if (!incentives) return ['No shipping information available'];
  
  return incentives.split('\n')
    .filter(line => line.trim())
    .map(line => line.trim())
    .slice(0, 5); // Limit to top 5 points for readability
}

// Helper function to get threshold position for slider (0-100%)
function getThresholdPosition(threshold: number | null): number {
  if (!threshold) return 0;
  // Scale $0-$200+ range to 0-100%
  return Math.min((threshold / 200) * 100, 100);
}

// Helper function to get threshold color based on amount
function getThresholdColor(threshold: number | null): string {
  if (!threshold) return 'bg-gray-400';
  if (threshold === 0) return 'bg-green-500';
  if (threshold <= 50) return 'bg-yellow-500';
  if (threshold <= 100) return 'bg-orange-500';
  return 'bg-red-500';
}

export default function CompetitorResults({ data, websiteUrl }: CompetitorResultsProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analysis data available</p>
      </div>
    );
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          analysisData: data,
          websiteUrl: websiteUrl || ''
        }),
      });

      if (response.ok) {
        setSubmitMessage('✅ Report sent successfully! Check your email in a few minutes.');
        setEmail('');
      } else {
        setSubmitMessage('❌ Failed to send report. Please try again.');
      }
    } catch (error) {
      setSubmitMessage('❌ Failed to send report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Business Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Business Analysis</h2>
        <div className="prose max-w-none">
          {data.business_analysis ? (
            data.business_analysis.split('\n').map((line, index) => (
              <p key={index} className="mb-2 text-gray-700">{line}</p>
            ))
          ) : (
            <p className="text-gray-500">Business analysis not available</p>
          )}
        </div>
      </div>

      {/* User Shipping Analysis */}
      {data.user_shipping && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Your Shipping Analysis</h2>
          {data.user_shipping.threshold !== null && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Free Shipping Threshold</h3>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-orange-500 h-4 rounded-full flex items-center justify-end pr-2"
                    style={{ 
                      width: `${Math.min((data.user_shipping.threshold / 200) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <p className="text-gray-700">{data.user_shipping.analysis}</p>
        </div>
      )}

      {/* Competitor Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Competitor Analysis</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.competitors && data.competitors.length > 0 ? (
            data.competitors.map((competitor, index) => {
              const shippingInfo = extractShippingInfo(competitor);
              const { threshold, type, displayText, hasShipping } = shippingInfo;
              
              // Get shipping details for display
              const getShippingDisplayData = () => {
                const comprehensiveData = competitor.comprehensiveData || competitor.businessData;
                
                if (comprehensiveData?.shipping_info) {
                  const info = comprehensiveData.shipping_info;
                  const details = [];
                  
                  if (info.free_shipping_conditions) details.push(info.free_shipping_conditions);
                  if (info.regional_shipping_notes) details.push(info.regional_shipping_notes);
                  if (info.general_shipping_policy) details.push(info.general_shipping_policy);
                  
                  return details.length > 0 ? details : [displayText];
                }
                
                // Fallback to legacy data
                const incentives = competitor.shipping_incentives || competitor.shippingAnalysis;
                if (incentives) {
                  return incentives.split('\n').filter(line => line.trim()).slice(0, 3);
                }
                
                return [displayText];
              };
              
              const shippingDetails = getShippingDisplayData();
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">{competitor.name}</h3>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-900 mb-1">
                      <span className="font-medium">Website:</span>{' '}
                      <a 
                        href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {competitor.website.replace(/^https?:\/\//, '')}
                      </a>
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Products:</span> {competitor.products}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Shipping Incentives:</h4>
                    
                    {/* Threshold Slider Bar - Only show if free shipping is offered */}
                    {hasShipping && threshold !== null && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>$0</span>
                          <span>$50</span>
                          <span>$100</span>
                          <span>$150</span>
                          <span>$200+</span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`absolute h-3 rounded-full ${getThresholdColor(threshold)}`}
                            style={{ width: `${getThresholdPosition(threshold)}%` }}
                          ></div>
                          <div 
                            className="absolute -top-1 w-5 h-5 bg-white border-2 border-gray-400 rounded-full flex items-center justify-center"
                            style={{ 
                              left: `calc(${getThresholdPosition(threshold)}% - 10px)`,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                            }}
                          >
                            <div className={`w-2 h-2 rounded-full ${getThresholdColor(threshold)}`}></div>
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            ${threshold === 0 ? 'Free' : threshold} Free Shipping
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Shipping Details as Bullet List */}
                    <div className="space-y-2">
                      {shippingDetails.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-start space-x-2">
                          <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                          <span className="text-sm text-gray-700 leading-relaxed">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No competitor data available</p>
          )}
        </div>
      </div>

      {/* Email Recommendations Call-to-Action */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            📧 Get Your Personalized Action Plan
          </h2>
          <p className="text-gray-900 mb-4 max-w-2xl mx-auto">
            Receive a detailed email report with specific next steps, implementation timeline, 
            and actionable strategies tailored to your business based on this competitor analysis.
          </p>
          
          <div className="bg-white rounded-lg p-4 max-w-md mx-auto shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Your report will include:</h3>
            <div className="text-left space-y-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Immediate action items for this week</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>30-day strategic implementation plan</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Advanced optimization tactics</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Competitor monitoring recommendations</span>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleEmailSubmit} className="mt-6 max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send My Report'}
              </button>
            </div>
            {submitMessage && (
              <p className={`text-sm mt-3 ${submitMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {submitMessage}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Free report • No spam • Actionable insights only
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}