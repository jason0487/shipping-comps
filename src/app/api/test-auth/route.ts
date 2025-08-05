import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('Testing authentication with:', { email, password: password ? 'provided' : 'missing' })
    
    // Test sign up first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email || 'test@example.com',
      password: password || 'testpassword123',
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      }
    })
    
    if (signUpError) {
      console.error('Sign up error:', signUpError)
    }
    
    // Test sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email || 'test@example.com',  
      password: password || 'testpassword123'
    })
    
    if (signInError) {
      console.error('Sign in error:', signInError)
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        signUp: {
          success: !signUpError,
          error: signUpError?.message,
          data: signUpData ? 'user created' : 'no data'
        },
        signIn: {
          success: !signInError,
          error: signInError?.message,
          data: signInData ? 'user signed in' : 'no data'
        }
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing'
      }
    })
    
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}