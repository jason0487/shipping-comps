'use client';

import { useState } from 'react';

export default function SimpleGoogleTest() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  const handleGoogleAuth = () => {
    try {
      addLog('Starting Google OAuth test...');
      
      const currentOrigin = window.location.origin;
      const redirectUri = `${currentOrigin}/auth/google/callback`;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      addLog(`Origin: ${currentOrigin}`);
      addLog(`Redirect URI: ${redirectUri}`);
      addLog(`Client ID present: ${!!clientId}`);
      
      if (!clientId) {
        addLog('ERROR: No Google Client ID found');
        return;
      }
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=openid email profile&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=test_state_${Date.now()}`;
      
      addLog(`Auth URL: ${authUrl.substring(0, 100)}...`);
      addLog('Redirecting to Google in 2 seconds...');
      
      setTimeout(() => {
        window.location.href = authUrl;
      }, 2000);
      
    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Google auth error:', error);
    }
  };

  const testApiDirectly = async () => {
    try {
      addLog('Testing API endpoint directly...');
      
      const response = await fetch('/api/auth/google-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'test_code_12345',
          redirect_uri: `${window.location.origin}/auth/google/callback`,
        }),
      });
      
      addLog(`API Response Status: ${response.status}`);
      
      const data = await response.json();
      addLog(`API Response: ${JSON.stringify(data, null, 2)}`);
      
    } catch (error) {
      addLog(`API Test Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-8">Simple Google OAuth Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Controls</h2>
            
            <button
              onClick={handleGoogleAuth}
              className="w-full bg-red-500 text-white py-3 px-4 rounded hover:bg-red-600"
            >
              Test Google OAuth Flow
            </button>
            
            <button
              onClick={testApiDirectly}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded hover:bg-blue-600"
            >
              Test API Endpoint
            </button>
            
            <button
              onClick={clearLogs}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Environment Check</h3>
              <p className="text-sm">Origin: {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}</p>
              <p className="text-sm">Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Present' : 'Missing'}</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1 break-all">{log}</div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">Click a button to start testing...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}