'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState('Processing...');
  const router = useRouter();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        console.log('Google callback started, current URL:', window.location.href);
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');

        console.log('URL parameters:', { code: !!code, error, state });

        if (error) {
          console.error('OAuth error received from Google:', error);
          const errorDescription = urlParams.get('error_description');
          console.error('Error description:', errorDescription);
          const errorMessage = `Google OAuth Error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`;
          setStatus(errorMessage);
          
          // Handle popup vs redirect
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ 
              type: 'GOOGLE_AUTH_ERROR', 
              error: errorMessage 
            }, window.location.origin);
            setTimeout(() => window.close(), 2000);
          } else {
            setTimeout(() => router.push('/sign-in'), 5000);
          }
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          const errorMessage = 'No authorization code received. Please try again.';
          setStatus(errorMessage);
          
          // Handle popup vs redirect
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ 
              type: 'GOOGLE_AUTH_ERROR', 
              error: errorMessage 
            }, window.location.origin);
            setTimeout(() => window.close(), 2000);
          } else {
            setTimeout(() => router.push('/sign-in'), 3000);
          }
          return;
        }

        setStatus('Processing authentication...');
        console.log('Calling server-side OAuth API...');

        // Call our server-side API to handle the OAuth flow
        const response = await fetch('/api/auth/google-oauth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: window.location.origin + '/auth/google/callback',
          }),
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error:', errorData);
          throw new Error(errorData.error || 'Authentication failed');
        }

        const userData = await response.json();
        console.log('User data received:', userData);
        
        setStatus('Creating session...');

        // Store user data in localStorage for AuthContext
        try {
          const userDataToStore = {
            id: userData.user.id,
            email: userData.user.email,
            fullName: userData.user.full_name,
            tokens: userData.user.tokens || 1
          };
          console.log('Storing user data:', userDataToStore);
          localStorage.setItem('google-oauth-user', JSON.stringify(userDataToStore));
          
          setStatus('Success! Authentication complete.');
          
          // Check if this is running in a popup window
          if (window.opener && !window.opener.closed) {
            console.log('Running in popup, sending message to parent');
            // Send success message to parent window immediately
            window.opener.postMessage({ 
              type: 'GOOGLE_AUTH_SUCCESS', 
              user: userDataToStore 
            }, window.location.origin);
            
            // Close the popup immediately after sending message
            setTimeout(() => {
              window.close();
            }, 100);
          } else {
            console.log('Not in popup, redirecting to homepage');
            // Not in popup, redirect normally
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
          }
        } catch (storageError) {
          console.error('Storage error:', storageError);
          setStatus('Authentication successful but session storage failed. Closing...');
          
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ 
              type: 'GOOGLE_AUTH_ERROR', 
              error: 'Session storage failed' 
            }, window.location.origin);
            setTimeout(() => window.close(), 1000);
          } else {
            setTimeout(() => window.location.href = '/', 1000);
          }
        }

      } catch (error) {
        console.error('Google callback error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        const errorMessage = `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        setStatus(errorMessage);
        
        // Handle popup vs redirect
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ 
            type: 'GOOGLE_AUTH_ERROR', 
            error: errorMessage 
          }, window.location.origin);
          setTimeout(() => window.close(), 3000);
        } else {
          setTimeout(() => router.push('/sign-in'), 5000);
        }
      }
    };

    handleGoogleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FBFAF9] flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Signing you in...</h2>
          <p className="text-gray-600">{status}</p>
        </div>
      </div>
    </div>
  );
}