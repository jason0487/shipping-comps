'use client';

import { useState } from 'react';

export default function TestGoogleOAuth() {
  const [debug, setDebug] = useState<any>(null);
  const [error, setError] = useState('');

  const testConfig = async () => {
    try {
      const response = await fetch('/api/debug-google-config');
      const data = await response.json();
      setDebug(data);
      console.log('Google OAuth Config:', data);
    } catch (err) {
      console.error('Config test error:', err);
      setError('Failed to check config');
    }
  };

  const testPopup = () => {
    try {
      const popup = window.open('https://www.google.com', 'test-popup', 'width=500,height=600');
      if (popup) {
        console.log('Popup opened successfully');
        setTimeout(() => popup.close(), 3000);
      } else {
        console.error('Popup blocked');
        setError('Popup blocked by browser');
      }
    } catch (err) {
      console.error('Popup test error:', err);
      setError('Popup test failed');
    }
  };

  const testGoogleAuth = () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      console.log('Client ID check:', clientId ? 'EXISTS' : 'MISSING');
      
      if (!clientId) {
        setError('NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing');
        return;
      }

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${window.location.origin}/auth/google/callback&scope=openid email profile&response_type=code`;
      console.log('Auth URL:', authUrl);

      const popup = window.open(authUrl, 'google-test', 'width=500,height=600');
      if (!popup) {
        setError('Google OAuth popup blocked');
      } else {
        console.log('Google OAuth popup opened');
        setTimeout(() => popup.close(), 5000);
      }
    } catch (err) {
      console.error('Google auth test error:', err);
      setError(`Google auth test failed: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Google OAuth Debug Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <button 
            onClick={testConfig}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Test Configuration
          </button>

          <button 
            onClick={testPopup}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Test Popup (Google.com)
          </button>

          <button 
            onClick={testGoogleAuth}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Test Google OAuth
          </button>

          {debug && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-bold">Configuration Debug:</h3>
              <pre className="text-sm">{JSON.stringify(debug, null, 2)}</pre>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>First test configuration to see if environment variables are set</li>
            <li>Test popup to see if popups work in your browser</li>
            <li>Test Google OAuth to see the actual authentication flow</li>
            <li>Check browser console (F12) for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}