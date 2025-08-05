import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: {
          url: supabaseUrl ? 'present' : 'missing',
          key: supabaseKey ? 'present' : 'missing'
        }
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    return NextResponse.json({
      success: true,
      connection: error ? 'failed' : 'working',
      error: error?.message,
      config: {
        url: supabaseUrl.substring(0, 30) + '...',
        key: supabaseKey.substring(0, 20) + '...'
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json()
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
        }
      })
      
      return NextResponse.json({
        success: !error,
        error: error?.message,
        data: data ? 'signup attempted' : 'no data',
        user: data.user ? { id: data.user.id, email: data.user.email } : null
      })
    }
    
    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      return NextResponse.json({
        success: !error,
        error: error?.message,
        data: data ? 'signin successful' : 'no data',
        user: data.user ? { id: data.user.id, email: data.user.email } : null
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}