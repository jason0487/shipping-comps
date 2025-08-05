'use client';

import { useState } from 'react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => void;
  onSignUp: (email: string, password: string, fullName?: string) => void;
}

export default function SignInModal({ isOpen, onClose, onSignIn, onSignUp }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      // Debug Google OAuth configuration
      const debugResponse = await fetch('/api/debug-google-config');
      const debugData = await debugResponse.json();
      console.log('Google OAuth Config Debug:', debugData);
      console.log('Google OAuth URL Debug:', {
        redirectUri,
        clientId: clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET',
        origin: window.location.origin
      });

      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }

      // Build OAuth URL with proper parameters
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'select_account');
      authUrl.searchParams.set('state', `modal_auth_${Date.now()}`);

      console.log('Google OAuth URL:', authUrl.toString());
      console.log('Opening Google OAuth in popup');
      
      // Open OAuth in popup window
      const popup = window.open(
        authUrl.toString(), 
        'google-oauth', 
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        console.error('Popup blocked or failed to open');
        setError('Popup blocked. Please allow popups for this site or try again.');
        setLoading(false);
        return;
      }

      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        // Only accept messages from our domain
        if (event.origin !== window.location.origin) return;
        
        console.log('Received message from popup:', event.data);
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          console.log('Google auth success received:', event.data.user);
          
          // Store the user data in localStorage immediately
          localStorage.setItem('google-oauth-user', JSON.stringify(event.data.user));
          localStorage.setItem('auth-timestamp', Date.now().toString());
          console.log('Stored Google OAuth user in localStorage:', event.data.user);
          
          cleanup();
          onClose(); // Close the modal
          
          // Force reload after brief delay to ensure localStorage is written
          setTimeout(() => {
            console.log('Forcing page reload to update auth state');
            window.location.reload();
          }, 500);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          console.log('Google auth error received:', event.data.error);
          cleanup();
          setError(event.data.error || 'Authentication failed');
        }
      };

      // Setup cleanup function
      const cleanup = () => {
        clearInterval(checkClosed);
        clearTimeout(timeoutId);
        window.removeEventListener('message', handleMessage);
        setLoading(false);
        if (!popup.closed) popup.close();
      };

      // Add message listener
      window.addEventListener('message', handleMessage);

      // Monitor popup for manual closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log('Popup was manually closed');
          cleanup();
          setError('Authentication was cancelled');
        }
      }, 1000);

      // Close popup after 5 minutes if still open
      const timeoutId = setTimeout(() => {
        if (!popup.closed) {
          console.log('Popup timed out');
          cleanup();
          setError('Authentication timed out');
        }
      }, 300000);

    } catch (error) {
      console.error('Google sign-in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError('Please enter your full name');
          return;
        }
        await onSignUp(email, password, fullName);
      } else {
        await onSignIn(email, password);
      }
      
      setEmail('');
      setPassword('');
      setFullName('');
      onClose();
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4 pt-20">
      <div className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-200 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={isSignUp}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
              minLength={isSignUp ? 6 : undefined}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}