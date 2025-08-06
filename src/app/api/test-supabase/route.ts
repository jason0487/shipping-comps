import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }
    
    // Test auth functionality
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    return NextResponse.json({
      success: true,
      connection: 'working',
      auth: authError ? { error: authError.message } : { status: 'available' },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing',
        urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        keyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
      }
    })
    
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}