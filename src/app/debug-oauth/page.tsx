'use client';

import { useEffect, useState } from 'react';

export default function DebugOAuthPage() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [googleAuthUrl, setGoogleAuthUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const callbackUri = `${origin}/auth/google/callback`;
      
      setCurrentUrl(origin);
      setRedirectUri(callbackUri);
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(callbackUri)}&` +
        `scope=openid email profile&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      setGoogleAuthUrl(authUrl);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Google OAuth Debug Information</h1>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Current Environment</h2>
            <div className="space-y-2">
              <p><strong>Current Origin:</strong> <code className="bg-white px-2 py-1 rounded">{currentUrl}</code></p>
              <p><strong>Google Client ID:</strong> <code className="bg-white px-2 py-1 rounded">{process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'NOT SET'}</code></p>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-yellow-900">⚠️ Required Google Console Configuration</h2>
            <p className="mb-4">You need to add this EXACT redirect URI to your Google OAuth application:</p>
            
            <div className="bg-white p-4 rounded border-2 border-yellow-400">
              <p className="font-mono text-sm break-all">{redirectUri}</p>
              <button 
                onClick={() => copyToClipboard(redirectUri)}
                className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                Copy Redirect URI
              </button>
            </div>
            
            <div className="mt-4 text-sm text-yellow-800">
              <p><strong>Steps to configure:</strong></p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-600 underline">Google Cloud Console</a></li>
                <li>Select your project</li>
                <li>Go to "APIs & Services" → "Credentials"</li>
                <li>Click on your OAuth 2.0 Client ID</li>
                <li>Add the redirect URI above to "Authorized redirect URIs"</li>
                <li>Save the changes</li>
              </ol>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-900">Test Google OAuth</h2>
            <p className="mb-4">Once you've configured the redirect URI above, test the OAuth flow:</p>
            
            <button 
              onClick={() => window.location.href = googleAuthUrl}
              className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Test Google Sign In</span>
            </button>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">All Required Redirect URIs</h2>
            <p className="mb-4">For different environments, you may need to configure these redirect URIs:</p>
            
            <div className="space-y-2">
              <div>
                <p className="font-semibold">Development (localhost):</p>
                <code className="bg-white px-2 py-1 rounded block">http://localhost:5000/auth/google/callback</code>
              </div>
              <div>
                <p className="font-semibold">Development (Replit):</p>
                <code className="bg-white px-2 py-1 rounded block">{currentUrl}/auth/google/callback</code>
              </div>
              <div>
                <p className="font-semibold">Production:</p>
                <code className="bg-white px-2 py-1 rounded block">https://www.shippingcomps.com/auth/google/callback</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}