import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    env_check: {
      stripe_secret: !!process.env.STRIPE_SECRET_KEY,
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test subscription request body:', body);
    
    return NextResponse.json({
      received: body,
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test subscription error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}