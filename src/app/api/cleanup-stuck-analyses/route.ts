import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Cleanup analyses that have been stuck in processing for more than 5 minutes
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseClient();
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString(); // 3 minutes threshold
    
    // Find stuck processing records
    const { data: stuckAnalyses, error: fetchError } = await supabaseAdmin
      .from('analysis_history')
      .select('id, website_url, user_id, created_at')
      .eq('status', 'processing')
      .lt('created_at', threeMinutesAgo);

    if (fetchError) {
      console.error('Error fetching stuck analyses:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch stuck analyses' }, { status: 500 });
    }

    if (!stuckAnalyses || stuckAnalyses.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No stuck analyses found',
        cleanedCount: 0 
      });
    }

    // Update stuck analyses to failed status
    const { error: updateError } = await supabaseAdmin
      .from('analysis_history')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'processing')
      .lt('created_at', threeMinutesAgo);

    if (updateError) {
      console.error('Error updating stuck analyses:', updateError);
      return NextResponse.json({ error: 'Failed to update stuck analyses' }, { status: 500 });
    }

    console.log(`Cleaned up ${stuckAnalyses.length} stuck analyses:`, 
      stuckAnalyses.map(a => ({ id: a.id, url: a.website_url })));

    return NextResponse.json({ 
      success: true, 
      message: `Successfully cleaned up ${stuckAnalyses.length} stuck analyses`,
      cleanedCount: stuckAnalyses.length,
      cleanedAnalyses: stuckAnalyses
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}