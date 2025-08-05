import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      buildVersion: 'PAYMENT_HISTORY_v2.2',
      receivedData: body,
      paymentFixesDeployed: true,
      changes: [
        'Direct card confirmation in PaymentModal',
        'Session persistence without reload',
        'Event-based token refresh system',
        'AuthContext.refreshTokens() method added'
      ],
      environment: process.env.NODE_ENV,
      deployment: 'This API confirms payment fixes are deployed'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}