'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase as getSupabaseClient } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  fullName?: string;
  tokens?: number;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => void;
  refreshTokens: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (supabaseUser: SupabaseUser): Promise<void> => {
    try {
      console.log('Loading profile for user:', supabaseUser.email);
      
      const { data: userData, error } = await getSupabaseClient()
        .from('users')
        .select(`
          id,
          email,
          full_name,
          created_at,
          user_tokens (
            tokens_remaining
          )
        `)
        .eq('email', supabaseUser.email)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        if (error.code === 'PGRST116') {
          console.log('User not found, creating new profile...');
          
          const { data: newUser, error: createError } = await getSupabaseClient()
            .from('users')
            .insert({
              email: supabaseUser.email!,
              full_name: supabaseUser.user_metadata?.full_name || null,
              supabase_id: supabaseUser.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id, email, full_name, created_at')
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            throw createError;
          }

          console.log('New user profile created:', newUser);

          // Create HubSpot lead (non-blocking)
          try {
            await fetch('/api/hubspot-lead', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: newUser.email,
                name: newUser.full_name || newUser.email.split('@')[0],
                user_id: newUser.id
              }),
            });
            console.log('HubSpot lead created for new user');
          } catch (hubspotError) {
            console.log('HubSpot lead creation failed (non-critical):', hubspotError);
          }
          
          const userObj = {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.full_name || undefined,
            tokens: 1
          };
          
          setUser(userObj);
          
          // Cache user session for 1 hour
          localStorage.setItem('auth-user-session', JSON.stringify(userObj));
          localStorage.setItem('auth-user-timestamp', Date.now().toString());
        } else {
          throw error;
        }
      } else {
        console.log('User profile loaded:', userData);
        
        const totalTokens = userData.user_tokens?.reduce((sum: number, tokenRecord: any) => 
          sum + (tokenRecord.tokens_remaining || 0), 0) || 0;

        await getSupabaseClient()
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userData.id);

        const userObj = {
          id: userData.id,
          email: userData.email,
          fullName: userData.full_name || undefined,
          tokens: totalTokens
        };
        
        setUser(userObj);
        
        // Cache user session for 1 hour
        localStorage.setItem('auth-user-session', JSON.stringify(userObj));
        localStorage.setItem('auth-user-timestamp', Date.now().toString());
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting sign in for:', email);
      
      // Use our API endpoint for consistent authentication
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AuthContext: API sign in error:', errorData);
        throw new Error(errorData.error || 'Sign in failed');
      }

      const { user, session } = await response.json();
      console.log('AuthContext: Sign in successful for:', user.email);
      
      setUser(user);
      
      // Cache user session for 1 hour
      localStorage.setItem('auth-user-session', JSON.stringify(user));
      localStorage.setItem('auth-user-timestamp', Date.now().toString());
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('AuthContext: Attempting sign up for:', email);
      
      // Use our API endpoint for consistent authentication
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AuthContext: API sign up error:', errorData);
        throw new Error(errorData.error || 'Sign up failed');
      }

      const { user, session, needsConfirmation } = await response.json();
      console.log('AuthContext: Sign up successful for:', user.email);
      
      if (session && !needsConfirmation) {
        setUser(user);
        
        // Cache user session for 1 hour
        localStorage.setItem('auth-user-session', JSON.stringify(user));
        localStorage.setItem('auth-user-timestamp', Date.now().toString());
      }
      // If email confirmation is needed, user will be set after they confirm
    } catch (error) {
      console.error('AuthContext: Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      setUser(null);
      localStorage.removeItem('demo-user');
      localStorage.removeItem('auth-user-session');
      localStorage.removeItem('auth-user-timestamp');
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Sign out failed:', error);
      setUser(null);
    }
  };

  const refreshTokens = async () => {
    if (!user) return;
    
    try {
      console.log('Refreshing tokens for user:', user.email);
      
      // First refresh the Supabase session to prevent timeout
      const { data: sessionData, error: sessionError } = await getSupabaseClient().auth.refreshSession();
      if (sessionError) {
        console.warn('Session refresh warning:', sessionError);
      }
      
      const { data: userData, error } = await getSupabaseClient()
        .from('users')
        .select(`
          user_tokens (
            tokens_remaining
          )
        `)
        .eq('id', user.id)
        .single();

      if (!error && userData) {
        const totalTokens = userData.user_tokens?.reduce((sum: number, tokenRecord: any) => 
          sum + (tokenRecord.tokens_remaining || 0), 0) || 0;
        
        console.log('Refreshed token count:', totalTokens);
        const updatedUser = user ? { ...user, tokens: totalTokens } : null;
        setUser(updatedUser);
        
        // Update cached session with new token count
        if (updatedUser) {
          localStorage.setItem('auth-user-session', JSON.stringify(updatedUser));
          localStorage.setItem('auth-user-timestamp', Date.now().toString());
        }
      } else if (error) {
        console.warn('Token refresh error (non-critical):', error);
        // Don't clear user on token refresh error to prevent logout
      }
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      // Don't clear user on error to prevent logout during analysis
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        console.log('Checking for existing user data in localStorage...');
        
        const demoUser = localStorage.getItem('demo-user');
        const googleUser = localStorage.getItem('google-oauth-user');
        const cachedUser = localStorage.getItem('auth-user-session');
        
        console.log('Found localStorage items:', {
          demoUser: !!demoUser,
          googleUser: !!googleUser,
          cachedUser: !!cachedUser
        });
        
        if (googleUser) {
          console.log('Google OAuth user data:', googleUser);
        }
        
        if (demoUser) {
          console.log('Found demo user in localStorage');
          setUser(JSON.parse(demoUser));
          setLoading(false);
          return;
        }

        // Check for Google OAuth user from callback first (highest priority)
        if (googleUser) {
          console.log('Found Google OAuth user in localStorage:', googleUser);
          try {
            const userData = JSON.parse(googleUser);
            console.log('Parsed Google OAuth user data:', userData);
            
            // Ensure user data has required fields
            if (userData && userData.id && userData.email) {
              setUser(userData);
              
              // Move to permanent session storage
              localStorage.setItem('auth-user-session', JSON.stringify(userData));
              localStorage.setItem('auth-user-timestamp', Date.now().toString());
              localStorage.removeItem('google-oauth-user'); // Clean up after moving
              localStorage.removeItem('auth-timestamp'); // Clean up timing marker
              
              console.log('Google OAuth user successfully authenticated:', userData.email);
              
              if (mounted) {
                setLoading(false);
              }
              return;
            } else {
              console.error('Invalid Google OAuth user data structure:', userData);
              localStorage.removeItem('google-oauth-user');
            }
          } catch (error) {
            console.error('Error parsing Google OAuth user data:', error);
            localStorage.removeItem('google-oauth-user'); // Clean up invalid data
          }
        }

        // Check for cached user session next
        const authTimestamp = localStorage.getItem('auth-user-timestamp');
        
        if (cachedUser && authTimestamp) {
          try {
            const timestamp = parseInt(authTimestamp);
            const oneHourInMs = 60 * 60 * 1000; // 1 hour
            const isExpired = Date.now() - timestamp > oneHourInMs;
            
            if (isExpired) {
              console.log('Cached session expired, clearing...');
              localStorage.removeItem('auth-user-session');
              localStorage.removeItem('auth-user-timestamp');
            } else {
              const parsedUser = JSON.parse(cachedUser);
              console.log('Found cached user session:', parsedUser.email);
              setUser(parsedUser);
              setLoading(false);
              
              // Refresh token count in background
              setTimeout(() => {
                refreshTokens();
              }, 100);
              return;
            }
          } catch (error) {
            console.error('Error parsing cached user:', error);
            localStorage.removeItem('auth-user-session');
            localStorage.removeItem('auth-user-timestamp');
          }
        }

        const { data: { session }, error } = await getSupabaseClient().auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          return;
        }

        if (session?.user && mounted) {
          console.log('Found existing session, loading profile...');
          try {
            await loadUserProfile(session.user);
          } catch (error) {
            console.error('Failed to load profile for existing session:', error);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for token purchase events with delay to allow webhook processing
    const handleTokenPurchase = () => {
      console.log('Token purchase event detected, refreshing in 3 seconds...');
      // Delay to allow webhook processing time
      setTimeout(() => {
        refreshTokens();
      }, 3000);
    };
    
    // Listen for analysis completion to refresh session
    const handleAnalysisComplete = () => {
      console.log('Analysis completed, refreshing session...');
      setTimeout(() => {
        refreshTokens();
      }, 500);
    };

    // Listen for Google OAuth success to immediately update auth state
    const handleGoogleAuthSuccess = (event: any) => {
      console.log('Google auth success event received:', event.detail);
      const userData = event.detail;
      if (userData && mounted) {
        setUser(userData);
        localStorage.setItem('auth-user-session', JSON.stringify(userData));
        localStorage.setItem('auth-user-timestamp', Date.now().toString());
        console.log('User authenticated via Google OAuth');
      }
    };

    // Listen for localStorage changes to detect Google OAuth across tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'google-oauth-user' && e.newValue && mounted) {
        console.log('Google OAuth user detected in storage change:', e.newValue);
        try {
          const userData = JSON.parse(e.newValue);
          if (userData && userData.id && userData.email) {
            setUser(userData);
            localStorage.setItem('auth-user-session', JSON.stringify(userData));
            localStorage.setItem('auth-user-timestamp', Date.now().toString());
          }
        } catch (error) {
          console.error('Error handling storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tokensPurchased', handleTokenPurchase);
    window.addEventListener('analysisCompleted', handleAnalysisComplete);
    window.addEventListener('googleAuthSuccess', handleGoogleAuthSuccess);

    const { data: { subscription } } = getSupabaseClient().auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user && mounted) {
          try {
            await loadUserProfile(session.user);
          } catch (error) {
            console.error('Failed to load profile on auth state change:', error);
          }
        } else if (event === 'SIGNED_OUT' && mounted) {
          setUser(null);
          localStorage.removeItem('demo-user');
        }
      }
    );

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tokensPurchased', handleTokenPurchase);
      window.removeEventListener('analysisCompleted', handleAnalysisComplete);
      window.removeEventListener('googleAuthSuccess', handleGoogleAuthSuccess);
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    refreshTokens,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}