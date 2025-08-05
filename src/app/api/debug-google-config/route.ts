import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    return NextResponse.json({
      hasClientId: !!clientId,
      clientIdPrefix: clientId ? clientId.substring(0, 20) + '...' : 'NOT SET',
      hasClientSecret: !!clientSecret,
      environment: process.env.NODE_ENV,
      host: process.env.VERCEL_URL || 'localhost'
    });
  } catch (error) {
    console.error('Debug config error:', error);
    return NextResponse.json({ error: 'Failed to check config' }, { status: 500 });
  }
}