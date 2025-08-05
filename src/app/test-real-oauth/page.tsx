'use client';

import { useState, useEffect } from 'react';

export default function TestRealOAuth() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [redirectUri, setRedirectUri] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const callback = `${origin}/auth/google/callback`;
      setCurrentUrl(origin);
      setRedirectUri(callback);
      setClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'NOT_SET');
    }
  }, []);

  const startOAuth = () => {
    if (!clientId || clientId === 'NOT_SET') {
      alert('Google Client ID not configured');
      return;
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('state', `replit_test_${Date.now()}`);

    console.log('Starting OAuth with URL:', authUrl.toString());
    
    // Redirect to Google OAuth
    window.location.href = authUrl.toString();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-8 text-center">Real Google OAuth Test</h1>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Configuration Check</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Current URL:</strong> <code className="bg-white px-2 py-1 rounded">{currentUrl}</code></p>
              <p><strong>Redirect URI:</strong> <code className="bg-white px-2 py-1 rounded">{redirectUri}</code></p>
              <p><strong>Client ID:</strong> <code className="bg-white px-2 py-1 rounded">{clientId}</code></p>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800">Required Google Console URI</h2>
            <p className="mb-2 text-yellow-700">Make sure this EXACT URI is in your Google Console:</p>
            <div className="bg-white p-3 rounded border border-yellow-300">
              <code className="text-sm break-all">{redirectUri}</code>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(redirectUri)}
              className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Copy to Clipboard
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={startOAuth}
              disabled={!clientId || clientId === 'NOT_SET'}
              className="bg-red-500 text-white px-8 py-4 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto space-x-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Start Real Google OAuth Test</span>
            </button>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">What this test does:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Uses proper OAuth URL construction with URLSearchParams</li>
              <li>Includes 'select_account' prompt to force account selection</li>
              <li>Adds a unique state parameter for security</li>
              <li>Redirects to Google with exact configuration</li>
              <li>Google will redirect back to /auth/google/callback with real auth code</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-100 rounded">
              <p className="text-sm text-blue-800">
                <strong>After testing:</strong> If it fails, visit 
                <a href="/oauth-debug-simple" className="underline ml-1">Debug Page</a> 
                or try the <a href="/direct-oauth-test" className="underline ml-1">Direct Test</a>
                to see the exact error from Google.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}