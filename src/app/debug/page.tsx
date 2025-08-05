'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [testResult, setTestResult] = useState<string>('');

  const testProductionAPI = async () => {
    try {
      const response = await fetch('/api/debug-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'payment-fixes-deployed' })
      });
      
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Production Deployment Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Deployment Verification</h2>
          <p className="mb-4">Current timestamp: {new Date().toISOString()}</p>
          <p className="mb-4">Build version: PAYMENT_HISTORY_v2.2 - {new Date().toLocaleDateString()}</p>
          
          <button 
            onClick={testProductionAPI}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Production API
          </button>
          
          {testResult && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
              {testResult}
            </pre>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Payment Modal Changes Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
              <span>Direct card confirmation implemented</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
              <span>Session persistence added</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
              <span>Event-based token refresh system</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></span>
              <span>Awaiting production verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}