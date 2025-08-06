import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');

  if (provider === 'google') {
    // Redirect to Google OAuth
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/auth/google/callback`;
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=openid email profile&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    return NextResponse.redirect(googleAuthUrl);
  }

  return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    console.log('API: Attempting sign in for:', email);

    // Use Supabase Auth to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('API: Supabase auth error:', error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'No user data returned' }, { status: 401 });
    }

    console.log('API: Sign in successful, fetching profile...');

    // Get user profile from our database
    const { data: userData, error: profileError } = await supabase
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
      .eq('email', email)
      .single();

    if (profileError) {
      console.error('API: Profile fetch error:', profileError);
      
      if (profileError.code === 'PGRST116') {
        // User doesn't exist in our database, create them
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || null,
            supabase_id: data.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id, email, full_name, created_at')
          .single();

        if (createError) {
          console.error('API: Error creating user profile:', createError);
          return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
        }

        // Add initial token for new user
        await supabase
          .from('user_tokens')
          .insert({
            user_id: newUser.id,
            tokens_remaining: 1,
            tokens_purchased: 1,
            purchase_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        return NextResponse.json({
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.full_name,
            tokens: 1
          },
          session: data.session
        });
      } else {
        return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 });
      }
    }

    // Calculate total tokens
    const totalTokens = userData.user_tokens?.reduce((sum: number, tokenRecord: any) => 
      sum + (tokenRecord.tokens_remaining || 0), 0) || 0;

    // Update last login
    await supabase
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id);

    console.log('API: Sign in complete for:', userData.email);

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        tokens: totalTokens
      },
      session: data.session
    });

  } catch (error) {
    console.error('API: Sign in error:', error);
    return NextResponse.json({ 
      error: 'Authentication failed. Please try again.' 
    }, { status: 500 });
  }
}