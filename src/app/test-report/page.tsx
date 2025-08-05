'use client';

import { useState } from 'react';
import ShippingGauge from '@/components/ShippingGauge';
import CompetitorChanges from '@/components/CompetitorChanges';

export default function TestReport() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/generate-biweekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: 'https://mylesapparel.com/',
          userEmail: 'brownje04@gmail.com'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to generate report');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Test Bi-Weekly Report Generation
          </h1>

          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Test Parameters:</h3>
              <p className="text-blue-800"><strong>Website:</strong> https://mylesapparel.com/</p>
              <p className="text-blue-800"><strong>Email:</strong> brownje04@gmail.com</p>
            </div>

            <button
              onClick={generateReport}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Generating Report...' : 'Generate Test Report'}
            </button>
          </div>

          {loading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
                <p className="text-yellow-800">
                  Generating bi-weekly report... This may take 1-2 minutes.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-red-900 mb-2">Error:</h3>
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Preview of Report Components */}
          <div className="mb-6">
            <ShippingGauge 
              threshold={63} 
              previousThreshold={58} 
              competitorCount={5} 
            />
          </div>

          <CompetitorChanges />

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-medium text-green-900 mb-4">✅ Report Generated Successfully!</h3>
              
              <div className="space-y-4">
                <div>
                  <strong className="text-green-800">Message:</strong>
                  <p className="text-green-700">{result.message}</p>
                </div>

                {result.reportData && (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-gray-900 mb-3">Report Summary:</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Website Analyzed:</strong>
                        <p className="text-gray-600">{result.reportData.websiteUrl}</p>
                      </div>
                      
                      <div>
                        <strong>Competitors Analyzed:</strong>
                        <p className="text-gray-600">{result.reportData.competitorCount}</p>
                      </div>
                      
                      <div>
                        <strong>Average Free Shipping Threshold:</strong>
                        <p className="text-gray-600">${result.reportData.avgThreshold}</p>
                      </div>
                      
                      <div>
                        <strong>Thresholds Found:</strong>
                        <p className="text-gray-600">
                          {result.reportData.thresholds?.length > 0 
                            ? `$${result.reportData.thresholds.join(', $')}`
                            : 'None detected'
                          }
                        </p>
                      </div>
                    </div>

                    {result.reportData.businessAnalysis && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <strong className="text-gray-900">Business Analysis Preview:</strong>
                        <div className="bg-gray-50 rounded p-3 mt-2 text-sm text-gray-700">
                          {result.reportData.businessAnalysis.substring(0, 300)}...
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-sm text-green-600">
                  📧 Report has been sent to brownje04@gmail.com
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}