'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function VerifyPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Debug: Show current URL
        console.log('Current URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        
        // Get URL parameters from hash
        const hash = window.location.hash.substring(1);
        const urlParams = new URLSearchParams(hash);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        setDebugInfo(`Hash: ${hash.substring(0, 100)}...`);
        
        if (accessToken && refreshToken) {
          console.log('Tokens found, setting session...');
          
          // Set the session manually
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Session error:', error);
            setMessage(`Error setting session: ${error.message}`);
          } else {
            console.log('Session set successfully:', data);
            setMessage('Email verified successfully! Redirecting...');
            
            // Create profile if it doesn't exist
            if (data.user) {
              const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: data.user.id,
                  email: data.user.email!,
                  full_name: data.user.user_metadata?.full_name || '',
                  updated_at: new Date().toISOString(),
                });
              
              if (profileError) {
                console.error('Profile creation error:', profileError);
              }
            }
            
            setTimeout(() => {
              router.push('/');
            }, 2000);
          }
        } else {
          console.log('No tokens found in URL');
          setMessage('No verification tokens found in URL.');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setMessage(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Wait a bit for the page to load completely
    setTimeout(handleEmailConfirmation, 500);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verification</h1>
        
        {loading ? (
          <div className="text-gray-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Verifying your email...
            {debugInfo && (
              <div className="text-xs mt-2 bg-gray-100 p-2 rounded">
                {debugInfo}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className={`text-lg mb-4 ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </div>
            {debugInfo && (
              <div className="text-xs bg-gray-100 p-2 rounded">
                Debug: {debugInfo}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}