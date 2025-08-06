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
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: {}
    };

    // Check 1: Environment Variables
    debugInfo.checks.environmentVariables = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      PERPLEXITY_API_KEY: !!process.env.PERPLEXITY_API_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    // Check 2: Database Connection
    try {
      const supabaseAdmin = getSupabaseClient();
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);
      
      debugInfo.checks.database = {
        connected: !error,
        error: error?.message || null,
        recordCount: data?.length || 0
      };
    } catch (dbError) {
      debugInfo.checks.database = {
        connected: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      };
    }

    // Check 3: OpenAI API
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });
      
      debugInfo.checks.openai = {
        accessible: response.ok,
        status: response.status,
        error: response.ok ? null : await response.text()
      };
    } catch (openaiError) {
      debugInfo.checks.openai = {
        accessible: false,
        error: openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error'
      };
    }

    // Check 4: Perplexity API
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{
            role: 'user',
            content: 'Test connection'
          }],
          max_tokens: 10
        }),
      });
      
      debugInfo.checks.perplexity = {
        accessible: response.ok,
        status: response.status,
        error: response.ok ? null : await response.text()
      };
    } catch (perplexityError) {
      debugInfo.checks.perplexity = {
        accessible: false,
        error: perplexityError instanceof Error ? perplexityError.message : 'Unknown Perplexity error'
      };
    }

    // Check 5: Simple Website Scraping Test
    try {
      const testUrl = 'https://example.com';
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{
            role: 'user',
            content: `Please provide a brief summary of the website ${testUrl}`
          }],
          max_tokens: 100
        }),
      });
      
      debugInfo.checks.websiteScraping = {
        working: response.ok,
        status: response.status,
        error: response.ok ? null : await response.text()
      };
    } catch (scrapingError) {
      debugInfo.checks.websiteScraping = {
        working: false,
        error: scrapingError instanceof Error ? scrapingError.message : 'Unknown scraping error'
      };
    }

    // Overall health assessment
    const allChecks = Object.values(debugInfo.checks);
    const healthyChecks = allChecks.filter((check: any) => 
      check.connected !== false && 
      check.accessible !== false && 
      check.working !== false
    ).length;
    
    debugInfo.overall = {
      healthy: healthyChecks === allChecks.length,
      healthyChecks: healthyChecks,
      totalChecks: allChecks.length,
      status: healthyChecks === allChecks.length ? 'ALL_SYSTEMS_OPERATIONAL' : 'ISSUES_DETECTED'
    };

    return NextResponse.json(debugInfo, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}