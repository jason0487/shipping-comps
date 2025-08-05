'use client';

import { useState } from 'react';

export default function FirecrawlPOC() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const testFirecrawl = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/poc/test-firecrawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website_url: websiteUrl.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to connect to analysis service');
    } finally {
      setLoading(false);
    }
  };

  const testPrimaryFirecrawl = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/poc/test-primary-firecrawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website_url: websiteUrl.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to connect to analysis service');
    } finally {
      setLoading(false);
    }
  };

  const testUnifiedPipeline = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/poc/openai-firecrawl-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website_url: websiteUrl.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to connect to analysis service');
    } finally {
      setLoading(false);
    }
  };

  const testEnhancedCompetitorAnalysis = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/enhanced-competitor-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website_url: websiteUrl.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Enhanced analysis failed');
      }
    } catch (err) {
      setError('Failed to connect to enhanced analysis service');
    } finally {
      setLoading(false);
    }
  };

  const testDemoEnhancedReport = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/demo-enhanced-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website_url: 'heirloomjerky.com'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Demo report failed');
      }
    } catch (err) {
      setError('Failed to connect to demo service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🚀 Firecrawl + AI Pipeline POC
          </h1>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-blue-900 mb-2">Recommended Test Sites:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <button onClick={() => setWebsiteUrl('allbirds.com')} className="text-left text-blue-700 hover:text-blue-900">allbirds.com</button>
              <button onClick={() => setWebsiteUrl('warbyparker.com')} className="text-left text-blue-700 hover:text-blue-900">warbyparker.com</button>
              <button onClick={() => setWebsiteUrl('casper.com')} className="text-left text-blue-700 hover:text-blue-900">casper.com</button>
              <button onClick={() => setWebsiteUrl('bombas.com')} className="text-left text-blue-700 hover:text-blue-900">bombas.com</button>
              <button onClick={() => setWebsiteUrl('glossier.com')} className="text-left text-blue-700 hover:text-blue-900">glossier.com</button>
              <button onClick={() => setWebsiteUrl('away.com')} className="text-left text-blue-700 hover:text-blue-900">away.com</button>
              <button onClick={() => setWebsiteUrl('heirloomjerky.com')} className="text-left text-blue-700 hover:text-blue-900">heirloomjerky.com</button>
            </div>
            <p className="text-xs text-blue-700 mt-2">Enhanced multi-page crawling now analyzes shipping/policy pages for complete data including CONUS policies.</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL to analyze:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="e.g., allbirds.com, warbyparker.com, casper.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={testPrimaryFirecrawl}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Testing...' : 'Test Primary Site Only'}
            </button>
            
            <button
              onClick={testFirecrawl}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Testing...' : 'Test Firecrawl Legacy'}
            </button>
            
            <button
              onClick={testUnifiedPipeline}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Full AI Pipeline'}
            </button>
            
            <button
              onClick={testEnhancedCompetitorAnalysis}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Enhanced 10-Competitor Analysis'}
            </button>
            
            <button
              onClick={testDemoEnhancedReport}
              disabled={loading}
              className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Demo Enhanced Business Report'}
            </button>
          </div>

          {loading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-blue-800">
                  {websiteUrl.includes('patagonia') ? 'Analyzing Patagonia and outdoor gear competitors...' :
                   websiteUrl.includes('allbirds') ? 'Analyzing Allbirds and sustainable footwear competitors...' :
                   'Analyzing website and discovering competitors...'}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Analysis Results
                </h2>
                
                {result.reportData ? (
                  // Full pipeline results
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Website:</span> {result.reportData.websiteUrl}
                        </div>
                        <div>
                          <span className="font-medium">Competitors Found:</span> {result.reportData.competitorCount}
                        </div>
                        <div>
                          <span className="font-medium">Primary Threshold:</span> {
                            result.reportData.primaryThreshold === 0 ? 'Free' : 
                            result.reportData.primaryThreshold ? `$${result.reportData.primaryThreshold}` : 'Not found'
                          }
                        </div>
                        <div>
                          <span className="font-medium">Average Threshold:</span> ${result.reportData.avgThreshold}
                        </div>
                      </div>
                    </div>

                    {/* Primary Website Firecrawl Data */}
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h3 className="font-semibold text-gray-900 mb-2">Primary Website Analysis: {result.reportData.websiteUrl}</h3>
                      
                      {/* Business Intelligence Summary */}
                      {result.reportData.primarySiteData && (
                        <div className="mb-4 space-y-3">
                          <div className="bg-white p-3 rounded border">
                            <h4 className="font-medium text-gray-800 mb-2">Business Profile</h4>
                            <div className="text-sm space-y-1">
                              <div><span className="font-medium">Name:</span> {result.reportData.primarySiteData.business_details?.name || 'Not found'}</div>
                              <div><span className="font-medium">Description:</span> {result.reportData.primarySiteData.business_details?.description || 'Not found'}</div>
                              <div><span className="font-medium">Price Range:</span> {result.reportData.primarySiteData.business_details?.price_range || 'Not found'}</div>
                              <div><span className="font-medium">Mission:</span> {result.reportData.primarySiteData.business_details?.mission_statement || 'Not found'}</div>
                            </div>
                          </div>
                          
                          <div className="bg-white p-3 rounded border">
                            <h4 className="font-medium text-gray-800 mb-2">Shipping Policy</h4>
                            <div className="text-sm space-y-1">
                              {result.reportData.primarySiteData.shipping_incentives?.map((incentive: any, idx: number) => (
                                <div key={idx}>
                                  <div><span className="font-medium">Policy:</span> {incentive.policy || 'Not found'}</div>
                                  <div><span className="font-medium">Threshold:</span> {incentive.threshold_amount === 'N/A' ? 'Free' : incentive.threshold_amount || 'Not found'}</div>
                                </div>
                              )) || <div>No shipping data found</div>}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                          View Raw Firecrawl Data
                        </summary>
                        <div className="mt-3 bg-white p-4 rounded border">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {JSON.stringify(result.reportData.primarySiteData || result.reportData.crawlData?.primarySite?.extractedInfo || {}, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Competitors Analysis</h3>
                      <div className="space-y-3">
                        {result.reportData.competitors.map((comp: any, idx: number) => (
                          <div key={idx} className="bg-white border border-gray-200 p-4 rounded-md">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{comp.name}</h4>
                              <span className="text-sm text-gray-600">{comp.website}</span>
                            </div>
                            <div className="text-sm text-gray-700 mb-3">
                              <span className="font-medium">Shipping Threshold:</span> {
                                comp.threshold === 0 ? 'Free' : 
                                comp.threshold ? `$${comp.threshold}` : 'Not found'
                              }
                            </div>
                            
                            {/* Business Intelligence Summary */}
                            {comp.businessData && (
                              <div className="mb-3 space-y-2">
                                <div className="bg-gray-50 p-2 rounded text-sm">
                                  <div><span className="font-medium">Description:</span> {comp.businessData.business_details?.description || 'Not available'}</div>
                                  <div><span className="font-medium">Price Range:</span> {comp.businessData.business_details?.price_range || 'Not available'}</div>
                                  <div><span className="font-medium">Mission:</span> {comp.businessData.business_details?.mission_statement || 'Not available'}</div>
                                </div>
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-600 mb-3">
                              <pre className="whitespace-pre-wrap">{comp.shippingAnalysis}</pre>
                            </div>
                            
                            {/* Raw Firecrawl Data */}
                            <details className="mt-3">
                              <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-medium">
                                View Raw Firecrawl Data
                              </summary>
                              <div className="mt-2 bg-gray-50 p-3 rounded border">
                                <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                  {JSON.stringify(comp.businessData || comp.rawFirecrawlData || {}, null, 2)}
                                </pre>
                              </div>
                            </details>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Business Analysis</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {result.reportData.businessAnalysis}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Recommendations</h3>
                      <div className="bg-green-50 p-4 rounded-md">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {result.reportData.recommendations}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : result.extractedData ? (
                  // Primary site test results
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-md">
                      <h3 className="font-semibold text-gray-900 mb-2">✅ Primary Site Firecrawl Test: {result.url}</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Business Details</h4>
                          <div className="bg-white p-3 rounded border">
                            <div className="mb-2">
                              <span className="font-medium">Name:</span> {result.extractedData.business_details?.name || 'Not found'}
                            </div>
                            <div className="mb-2">
                              <span className="font-medium">Description:</span> {result.extractedData.business_details?.description || 'Not found'}
                            </div>
                            <div>
                              <span className="font-medium">Products:</span>
                              <ul className="list-disc list-inside ml-4">
                                {result.extractedData.business_details?.products?.map((product: string, idx: number) => (
                                  <li key={idx} className="text-sm">{product}</li>
                                )) || <li className="text-sm text-gray-500">No products found</li>}
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Shipping Incentives</h4>
                          <div className="bg-white p-3 rounded border">
                            {result.extractedData.shipping_incentives?.length > 0 ? (
                              result.extractedData.shipping_incentives.map((incentive: any, idx: number) => (
                                <div key={idx} className="mb-2 p-2 bg-gray-50 rounded">
                                  <div className="text-sm">
                                    <span className="font-medium">Policy:</span> {incentive.policy || 'Not specified'}
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Free Shipping Tier:</span> {incentive.free_shipping_tier || 'Not specified'}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">No shipping incentives found</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Raw Extraction Data</h3>
                      <pre className="whitespace-pre-wrap text-xs text-gray-600 max-h-64 overflow-y-auto bg-gray-50 p-3 rounded">
                        {JSON.stringify(result.extractedData, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  // Legacy Firecrawl test results
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-semibold text-gray-900 mb-2">Extracted Shipping Info</h3>
                      <pre className="whitespace-pre-wrap text-sm text-gray-700">
                        {JSON.stringify(result.data?.extractedInfo || {}, null, 2)}
                      </pre>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Raw Response</h3>
                      <pre className="whitespace-pre-wrap text-xs text-gray-600 max-h-96 overflow-y-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}