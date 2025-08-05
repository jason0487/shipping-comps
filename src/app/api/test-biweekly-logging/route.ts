import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing bi-weekly email logging system...');

    // Test data
    const testData = {
      user_email: 'test@example.com',
      website_url: 'test.com',
      report_type: 'biweekly',
      subscription_id: 'test-subscription-123',
      email_sent_successfully: true,
      competitor_count: 5,
      avg_threshold: 75.50
    };

    // Call the logging API
    const loggingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/log-biweekly-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const loggingResult = await loggingResponse.json();

    if (loggingResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Bi-weekly email logging test completed successfully',
        results: {
          internal_log_id: loggingResult.internal_log_id,
          google_sheets_logged: loggingResult.google_sheets_logged,
          test_data: testData
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Bi-weekly email logging test failed',
        error: loggingResult.error,
        test_data: testData
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Bi-weekly email logging test endpoint',
    usage: 'Send POST request to test the logging system',
    example_data: {
      user_email: 'test@example.com',
      website_url: 'test.com',
      report_type: 'biweekly',
      subscription_id: 'test-subscription-123',
      email_sent_successfully: true,
      competitor_count: 5,
      avg_threshold: 75.50
    }
  });
}