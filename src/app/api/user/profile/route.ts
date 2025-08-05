import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const email = authHeader?.replace('Bearer ', '');

    if (!email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile from Supabase directly
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get analysis history
    const { data: analysisHistory, error: historyError } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    // Get active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_email', email)
      .eq('status', 'active');

    const profileData = {
      user: userData,
      analysisHistory: analysisHistory || [],
      subscriptions: subscriptions || [],
      totalAnalyses: analysisHistory?.length || 0,
      tokensRemaining: userData.tokens_remaining || 0
    };

    return NextResponse.json(profileData);

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}