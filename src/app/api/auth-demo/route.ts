import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json();

    // Handle demo authentication
    if (email === 'demo@example.com' && password === 'demo') {
      const demoUser = {
        id: 'demo-user',
        email: 'demo@example.com',
        fullName: 'Demo User',
        tokens: 10
      };

      return NextResponse.json({
        success: true,
        message: 'Demo authentication successful',
        user: demoUser
      });
    }

    // Handle test user authentication (for development)
    if (email === 'test@example.com' && password === 'testpass123') {
      const testUser = {
        id: 'test-user',
        email: 'test@example.com',
        fullName: 'Test User',
        tokens: 5
      };

      return NextResponse.json({
        success: true,
        message: 'Test authentication successful',
        user: testUser
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid demo credentials. Use demo@example.com / demo or test@example.com / testpass123'
    }, { status: 401 });

  } catch (error: any) {
    console.error('Demo auth error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}