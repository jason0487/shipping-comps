import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { code, redirect_uri } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 });
    }

    console.log('Exchanging authorization code for tokens...');

    // Exchange the authorization code for tokens
    const tokenParams = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri,
    });

    console.log('Token exchange parameters:', {
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri,
      code: code.substring(0, 20) + '...',
      grant_type: 'authorization_code'
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('Token exchange failed:', tokenError);
      return NextResponse.json({ error: 'Failed to exchange authorization code' }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    
    console.log('Getting user profile from Google...');

    // Get user profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('Profile fetch failed:', await profileResponse.text());
      return NextResponse.json({ error: 'Failed to get user profile' }, { status: 400 });
    }

    const profile = await profileResponse.json();
    
    console.log('Creating/updating user account for:', profile.email);

    // Check if user exists
    const { data: existingUser } = await supabase
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
      .eq('email', profile.email)
      .single();

    let userData;

    if (!existingUser) {
      // Generate UUID for new user
      const { randomUUID } = await import('crypto');
      const userId = randomUUID();
      
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: profile.email,
          full_name: profile.name,
          google_id: profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, email, full_name, created_at')
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
      }

      // Add initial token for new user
      const tokenId = randomUUID();
      const { error: tokenError } = await supabase
        .from('user_tokens')
        .insert({
          id: tokenId,
          user_id: newUser.id,
          tokens_remaining: 1,
          tokens_purchased: 1,
          purchase_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (tokenError) {
        console.error('Error creating initial tokens:', tokenError);
      }

      userData = {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        tokens: 1
      };
    } else {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          google_id: profile.id,
          full_name: profile.name,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', profile.email)
        .select('id, email, full_name, created_at')
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json({ error: 'Failed to update user account' }, { status: 500 });
      }

      // Calculate total tokens
      const totalTokens = existingUser.user_tokens?.reduce((sum: number, tokenRecord: any) => 
        sum + (tokenRecord.tokens_remaining || 0), 0) || 0;

      userData = {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        tokens: totalTokens
      };
    }

    console.log('Google OAuth success for:', userData.email);

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json({ 
      error: 'Authentication failed. Please try again.' 
    }, { status: 500 });
  }
}