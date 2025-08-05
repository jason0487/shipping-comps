import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const email = authHeader?.replace('Bearer ', '');

    if (!email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportPath = searchParams.get('path');

    if (!reportPath) {
      return NextResponse.json(
        { error: 'Report path required' },
        { status: 400 }
      );
    }

    // Verify user owns this report
    const { data: historyRecord, error } = await supabase
      .from('analysis_history')
      .select('pdf_path, website_url')
      .eq('user_email', email)
      .eq('pdf_path', reportPath)
      .single();

    if (error || !historyRecord) {
      return NextResponse.json(
        { error: 'Report not found or unauthorized' },
        { status: 404 }
      );
    }

    // For now, return a message that PDF generation is not available
    // TODO: Implement PDF generation in Next.js using jsPDF or similar
    return NextResponse.json(
      { 
        error: 'PDF generation temporarily unavailable. Please re-run your analysis to get updated results.',
        websiteUrl: historyRecord.website_url
      },
      { status: 503 }
    );

  } catch (error) {
    console.error('PDF download API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}