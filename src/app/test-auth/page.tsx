'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function TestAuthPage() {
  const { signIn, signUp, user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setResult('Testing sign up...');
      await signUp(email, password, fullName);
      setResult('Sign up successful!');
    } catch (error: any) {
      setResult(`Sign up failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setResult('Testing sign in...');
      await signIn(email, password);
      setResult('Sign in successful!');
    } catch (error: any) {
      setResult(`Sign in failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setResult('Redirecting to Google...');
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/google/callback')}&` +
      `scope=openid email profile&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
        
        {isAuthenticated ? (
          <div className="mb-6 p-4 bg-green-100 rounded">
            <p className="text-green-800">✅ Signed in as: {user?.email}</p>
            <p className="text-green-800">Tokens: {user?.tokens}</p>
            <p className="text-green-800">Name: {user?.fullName || 'Not set'}</p>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <p className="text-gray-600">Not authenticated</p>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Full Name (for sign up)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 border rounded"
          />
          
          <div className="space-y-2">
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Sign Up
            </button>
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              Sign In
            </button>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              Google Sign In
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="text-sm">{result}</p>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500 space-y-2">
          <p>Google Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Present' : 'Missing'}</p>
          <p>Current URL: {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}</p>
          <div className="bg-yellow-100 p-3 rounded mt-4">
            <p className="font-semibold text-yellow-800">⚠️ Google OAuth Setup Required:</p>
            <p className="text-yellow-700 text-xs mt-1">Add this redirect URI to your Google Console:</p>
            <p className="font-mono text-xs bg-white p-1 mt-1 rounded">
              {typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : 'Loading...'}
            </p>
            <p className="text-yellow-700 text-xs mt-2">
              Go to: Google Cloud Console → APIs & Services → Credentials → Your OAuth Client → Authorized redirect URIs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}