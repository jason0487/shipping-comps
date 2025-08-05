import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // This endpoint can be called by external cron services like cron-job.org
    // or GitHub Actions to check for due reports
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/generate-due-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Checked for due reports',
      result
    });

  } catch (error) {
    console.error('Error checking due reports:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check due reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}