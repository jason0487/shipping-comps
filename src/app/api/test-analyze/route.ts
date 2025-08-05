import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`Test analysis starting for: ${url}`);

    // Call the actual analyze API internally
    const response = await fetch(`${request.nextUrl.origin}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        // Test without userId to avoid authentication issues
      }),
    });

    const responseData = await response.json();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      url: url,
      timestamp: new Date().toISOString(),
      response: responseData,
      ...(response.ok ? {
        hasBusinessAnalysis: !!responseData.business_analysis,
        competitorCount: responseData.competitors?.length || 0,
        analysisLength: responseData.business_analysis?.length || 0
      } : {
        error: responseData.error || 'Unknown error',
        reason: responseData.reason || 'unknown'
      })
    });

  } catch (error) {
    console.error('Test analyze error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}