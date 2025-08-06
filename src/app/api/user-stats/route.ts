import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get analysis count (completed analyses)
    const { data: analysisData, error: analysisError } = await supabase
      .from('analysis_history')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (analysisError) {
      console.error('Error fetching analysis count:', analysisError);
    }

    // Get tokens remaining from user_tokens table 
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('tokens_remaining')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (tokenError) {
      console.error('Error fetching token data:', tokenError);
    }

    // Calculate total tokens remaining
    const totalTokens = tokenData?.reduce((sum, token) => sum + (token.tokens_remaining || 0), 0) || 0;

    // Get active subscriptions count (using is_active instead of status)
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (subscriptionError) {
      console.error('Error fetching subscription count:', subscriptionError);
    }

    const stats = {
      analysesCompleted: analysisData?.length || 0,
      tokensRemaining: totalTokens,
      activeSubscriptions: subscriptionData?.length || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in user-stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}