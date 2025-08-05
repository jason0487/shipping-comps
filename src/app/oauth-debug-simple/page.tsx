'use client';

import { useEffect, useState } from 'react';

export default function OAuthDebugSimple() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if we're on the callback URL
      const urlParams = new URLSearchParams(window.location.search);
      const info = {
        currentUrl: window.location.href,
        origin: window.location.origin,
        code: urlParams.get('code'),
        error: urlParams.get('error'),
        errorDescription: urlParams.get('error_description'),
        state: urlParams.get('state'),
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        redirectUri: `${window.location.origin}/auth/google/callback`
      };
      setDebugInfo(info);
      
      // Log to console for debugging
      console.log('OAuth Debug Info:', info);
    }
  }, []);

  const generateOAuthUrl = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      scope: 'openid email profile',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'select_account',
      state: `debug_${Date.now()}`
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const testOAuth = () => {
    try {
      const url = generateOAuthUrl();
      console.log('Generated OAuth URL:', url);
      console.log('Client ID check:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
      
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        alert('Google Client ID is not configured');
        return;
      }
      
      console.log('Redirecting to:', url);
      window.location.href = url;
    } catch (error) {
      console.error('OAuth URL generation error:', error);
      alert('Failed to generate OAuth URL: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">OAuth Debug Information</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Current Status</h2>
            <div className="space-y-2 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <strong>Current URL:</strong>
                <p className="break-all font-mono">{debugInfo.currentUrl}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <strong>Origin:</strong>
                <p className="font-mono">{debugInfo.origin}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <strong>Client ID:</strong>
                <p className="font-mono text-xs">{debugInfo.clientId}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <strong>Redirect URI:</strong>
                <p className="font-mono text-xs">{debugInfo.redirectUri}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">OAuth Response</h2>
            <div className="space-y-2 text-sm">
              {debugInfo.code && (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <strong className="text-green-800">✓ Authorization Code:</strong>
                  <p className="font-mono text-xs text-green-700">{debugInfo.code.substring(0, 50)}...</p>
                </div>
              )}
              
              {debugInfo.error && (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <strong className="text-red-800">✗ Error:</strong>
                  <p className="font-mono text-red-700">{debugInfo.error}</p>
                  {debugInfo.errorDescription && (
                    <>
                      <strong className="text-red-800">Description:</strong>
                      <p className="font-mono text-red-700">{debugInfo.errorDescription}</p>
                    </>
                  )}
                </div>
              )}
              
              {debugInfo.state && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <strong className="text-blue-800">State:</strong>
                  <p className="font-mono text-blue-700">{debugInfo.state}</p>
                </div>
              )}
              
              {!debugInfo.code && !debugInfo.error && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-600">No OAuth response detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={testOAuth}
            className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600"
          >
            Test Google OAuth
          </button>
        </div>
        
        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-yellow-800">Common Issues:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li><strong>redirect_uri_mismatch:</strong> The redirect URI in Google Console doesn't exactly match</li>
            <li><strong>unauthorized_client:</strong> The client ID is not configured properly</li>
            <li><strong>access_denied:</strong> User denied permission or account selection</li>
            <li><strong>invalid_request:</strong> Missing or invalid parameters in the OAuth request</li>
          </ul>
        </div>
        
        <div className="mt-6 bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Debug Data (JSON):</h3>
          <pre className="text-xs overflow-auto bg-white p-2 rounded border">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}