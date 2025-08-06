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
    const supabaseAdmin = getSupabaseClient();
    console.log('=== PRODUCTION DIAGNOSTICS STARTED ===');
    
    // Check 1: Recent analysis patterns
    const { data: recentAnalyses, error: analysisError } = await supabaseAdmin
      .from('analysis_history')
      .select('id, website_url, status, created_at, business_analysis, competitors_data')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (analysisError) {
      console.error('Failed to fetch recent analyses:', analysisError);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    // Analyze patterns
    const totalAnalyses = recentAnalyses?.length || 0;
    const completedAnalyses = recentAnalyses?.filter(a => a.status === 'completed') || [];
    const failedAnalyses = recentAnalyses?.filter(a => a.status === 'failed') || [];
    const processingAnalyses = recentAnalyses?.filter(a => a.status === 'processing') || [];

    // Check 2: Failed analysis details
    const failureReasons = failedAnalyses.map(analysis => ({
      id: analysis.id,
      url: analysis.website_url,
      time: analysis.created_at,
      hasBusinessAnalysis: !!analysis.business_analysis,
      hasCompetitorData: !!analysis.competitors_data
    }));

    // Check 3: Environment health
    const envHealth = {
      openai_key: !!process.env.OPENAI_API_KEY,
      perplexity_key: !!process.env.PERPLEXITY_API_KEY,
      database_url: !!process.env.DATABASE_URL
    };

    // Check 4: User token availability
    const { data: tokenStats, error: tokenError } = await supabaseAdmin
      .from('user_tokens')
      .select('user_id, tokens_remaining')
      .gt('tokens_remaining', 0);

    const activeTokenUsers = tokenStats?.length || 0;

    // Check 5: Recent successful patterns
    const successfulUrls = completedAnalyses.map(a => a.website_url);
    const failedUrls = failedAnalyses.map(a => a.website_url);

    console.log('=== PRODUCTION DIAGNOSTICS COMPLETE ===');

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      period: 'Last 24 hours',
      summary: {
        totalAnalyses,
        completed: completedAnalyses.length,
        failed: failedAnalyses.length,
        processing: processingAnalyses.length,
        successRate: totalAnalyses > 0 ? Math.round((completedAnalyses.length / totalAnalyses) * 100) : 0
      },
      environment: envHealth,
      userTokens: {
        activeUsers: activeTokenUsers,
        totalActiveTokens: tokenStats?.reduce((sum, user) => sum + user.tokens_remaining, 0) || 0
      },
      failureAnalysis: {
        count: failedAnalyses.length,
        details: failureReasons,
        commonFailedUrls: [...new Set(failedUrls)]
      },
      successPatterns: {
        count: completedAnalyses.length,
        recentSuccessfulUrls: [...new Set(successfulUrls)].slice(0, 10)
      },
      currentProcessing: processingAnalyses.map(a => ({
        id: a.id,
        url: a.website_url,
        startTime: a.created_at,
        runningFor: Math.round((Date.now() - new Date(a.created_at).getTime()) / 1000 / 60) + ' minutes'
      }))
    });

  } catch (error) {
    console.error('Production diagnostics error:', error);
    return NextResponse.json({
      error: 'Diagnostics failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}