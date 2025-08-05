'use client';

import { useState, useEffect } from 'react';

export default function DirectOAuthTest() {
  const [oauthUrl, setOauthUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    setClientId(id);
    
    if (id) {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(id)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20email%20profile&response_type=code&access_type=offline&prompt=select_account&state=direct_test_${Date.now()}`;
      setOauthUrl(url);
    }
  }, []);

  const handleDirectRedirect = () => {
    if (!oauthUrl) {
      setStatus('Error: No OAuth URL generated');
      return;
    }
    
    setStatus('Redirecting to Google...');
    console.log('Direct redirect to:', oauthUrl);
    
    // Use window.open first to test if it works
    const popup = window.open(oauthUrl, '_blank', 'width=500,height=600');
    
    if (!popup) {
      setStatus('Popup blocked - trying direct redirect...');
      setTimeout(() => {
        window.location.href = oauthUrl;
      }, 1000);
    } else {
      setStatus('Opened in popup - check popup window');
    }
  };

  const handleDirectNavigation = () => {
    if (!oauthUrl) {
      setStatus('Error: No OAuth URL generated');
      return;
    }
    
    setStatus('Direct navigation...');
    window.location.href = oauthUrl;
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(oauthUrl);
    setStatus('URL copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Direct OAuth URL Test</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Configuration</h2>
            <p><strong>Client ID:</strong> <code className="text-sm">{clientId || 'NOT SET'}</code></p>
            <p><strong>Status:</strong> <span className={clientId ? 'text-green-600' : 'text-red-600'}>{status}</span></p>
          </div>

          <div className="bg-blue-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Generated OAuth URL</h2>
            <div className="bg-white p-3 rounded border max-h-32 overflow-y-auto">
              <code className="text-xs break-all">{oauthUrl || 'URL not generated'}</code>
            </div>
            <div className="mt-2 space-x-2">
              <button
                onClick={copyUrl}
                disabled={!oauthUrl}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Copy URL
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Test Methods</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleDirectRedirect}
                disabled={!oauthUrl}
                className="bg-green-500 text-white p-4 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                Test 1: Popup Window
              </button>
              
              <button
                onClick={handleDirectNavigation}
                disabled={!oauthUrl}
                className="bg-red-500 text-white p-4 rounded hover:bg-red-600 disabled:bg-gray-400"
              >
                Test 2: Direct Navigation
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Troubleshooting</h3>
            <ul className="text-sm space-y-1">
              <li>• If popup is blocked, try Test 2 (Direct Navigation)</li>
              <li>• If you get a 403 error, check Google Console redirect URIs</li>
              <li>• If you get redirected back immediately, check the callback logs</li>
              <li>• The callback URL should be: <code className="bg-white px-1 rounded">{typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : ''}</code></li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Manual Test</h3>
            <p className="text-sm mb-2">Copy the OAuth URL above and paste it directly in a new browser tab to test manually.</p>
            <p className="text-sm text-gray-600">This bypasses any JavaScript issues and tests the raw OAuth configuration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}