'use client';

import { useEffect, useState } from 'react';

export default function TestGoogleOAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentOrigin, setCurrentOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
      addLog(`Current origin: ${window.location.origin}`);
      addLog(`Google Client ID present: ${!!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`);
    }
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testGoogleAuth = () => {
    const redirectUri = `${currentOrigin}/auth/google/callback`;
    addLog(`Testing with redirect URI: ${redirectUri}`);
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=openid email profile&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    addLog(`Full Google Auth URL: ${googleAuthUrl}`);
    addLog('Redirecting to Google...');
    
    // Add a small delay so the log appears before redirect
    setTimeout(() => {
      window.location.href = googleAuthUrl;
    }, 500);
  };

  const manuallyAddUri = () => {
    const uri = `${currentOrigin}/auth/google/callback`;
    navigator.clipboard.writeText(uri);
    addLog(`Copied to clipboard: ${uri}`);
    alert(`Copied to clipboard:\n${uri}\n\nAdd this to your Google Console Authorized redirect URIs`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-8">Google OAuth Test & Debug</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Current Environment</h2>
            <div className="bg-gray-50 p-4 rounded space-y-2">
              <p><strong>Origin:</strong> <code>{currentOrigin}</code></p>
              <p><strong>Redirect URI:</strong> <code>{currentOrigin}/auth/google/callback</code></p>
              <p><strong>Client ID:</strong> <code>{process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20)}...</code></p>
            </div>
            
            <div className="mt-6 space-y-3">
              <button
                onClick={testGoogleAuth}
                className="w-full bg-red-500 text-white py-3 px-4 rounded hover:bg-red-600 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Test Google Sign In</span>
              </button>
              
              <button
                onClick={manuallyAddUri}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Copy Current Redirect URI
              </button>
            </div>
            
            <div className="mt-6 bg-yellow-50 p-4 rounded">
              <h3 className="font-semibold text-yellow-800 mb-2">Required Google Console URIs:</h3>
              <div className="space-y-1 text-sm">
                <p>✅ https://www.shippingcomps.com/auth/google/callback</p>
                <p>✅ https://shippingcomps.com/auth/google/callback</p>
                <p>✅ http://localhost:5000/auth/google/callback</p>
                <p className="text-red-600">❓ {currentOrigin}/auth/google/callback</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">Logs will appear here...</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-red-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">If you get a 403 error:</h3>
          <ol className="list-decimal list-inside space-y-1 text-red-700">
            <li>Copy the redirect URI from above</li>
            <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
            <li>Click your OAuth 2.0 Client ID</li>
            <li>Add the copied URI to "Authorized redirect URIs"</li>
            <li>Save and wait 5 minutes for changes to propagate</li>
            <li>Try the test again</li>
          </ol>
        </div>
      </div>
    </div>
  );
}