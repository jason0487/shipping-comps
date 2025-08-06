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

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    console.log('API: Attempting sign up for:', email);

    // Use Supabase Auth to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/auth/callback`
      }
    });

    if (error) {
      console.error('API: Supabase signup error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'No user data returned' }, { status: 400 });
    }

    console.log('API: Sign up successful, creating profile...');

    // Create user profile in our database
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: data.user.email!,
        full_name: fullName || null,
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
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .insert({
        user_id: newUser.id,
        tokens_remaining: 1,
        tokens_purchased: 1,
        purchase_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('API: Error creating initial tokens:', tokenError);
    }

    console.log('API: Sign up complete for:', newUser.email);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        tokens: 1
      },
      session: data.session,
      needsConfirmation: !data.session // If no session, email confirmation is needed
    });

  } catch (error) {
    console.error('API: Sign up error:', error);
    return NextResponse.json({ 
      error: 'Registration failed. Please try again.' 
    }, { status: 500 });
  }
}