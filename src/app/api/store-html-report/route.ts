import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseClient();
    const body = await request.json();
    
    const { 
      analysisId,
      htmlContent,
      userId
    } = body;

    if (!analysisId || !htmlContent || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the analysis record with the HTML content
    const { error: updateError } = await supabaseAdmin
      .from('analysis_history')
      .update({ 
        pdf_url: 'html_report',
        report_html: htmlContent, // Store the actual HTML content
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error storing HTML report:', updateError);
      return NextResponse.json({ error: 'Failed to store HTML report' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Store HTML report error:', error);
    return NextResponse.json({ error: 'Failed to store HTML report' }, { status: 500 });
  }
}