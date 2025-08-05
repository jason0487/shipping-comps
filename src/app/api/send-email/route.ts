import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, analysisData, websiteUrl } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use the existing send-action-plan endpoint logic
    // This avoids Flask dependency by using our existing Next.js email system
    const actionPlanResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:5000'}/api/send-action-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        websiteUrl,
        businessAnalysis: analysisData?.business_analysis || '',
        competitors: analysisData?.competitors || [],
        userShipping: analysisData?.user_shipping || {}
      }),
    });

    if (!actionPlanResponse.ok) {
      throw new Error('Failed to send action plan email');
    }

    const result = await actionPlanResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send email report' },
      { status: 500 }
    );
  }
}