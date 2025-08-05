import { NextResponse } from 'next/server';

export async function GET() {
  const healthInfo = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    environmentVariables: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'present' : 'missing',
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY ? 'present' : 'missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'present' : 'missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'present' : 'missing',
    },
    urls: {
      analyze: '/api/analyze',
      health: '/api/health'
    }
  };

  return NextResponse.json(healthInfo);
}