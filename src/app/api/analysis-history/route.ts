import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count first
    const { count, error: countError } = await supabaseAdmin
      .from('analysis_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Count query error:', countError);
      return NextResponse.json({ error: 'Failed to fetch analysis count' }, { status: 500 });
    }

    // Get paginated results - ordered by most recent first
    const { data: history, error } = await supabaseAdmin
      .from('analysis_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching analysis history:', error);
      return NextResponse.json({ error: 'Failed to fetch analysis history' }, { status: 500 });
    }

    return NextResponse.json({ 
      history,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('Analysis history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      websiteUrl, 
      analysisType = 'competitor_analysis',
      competitorCount = 0,
      status = 'processing',
      businessAnalysis = null,
      competitorsData = null
    } = body;

    if (!userId || !websiteUrl) {
      return NextResponse.json({ error: 'User ID and website URL are required' }, { status: 400 });
    }

    // Insert new analysis history record
    const { data: newRecord, error } = await supabaseAdmin
      .from('analysis_history')
      .insert({
        user_id: userId,
        website_url: websiteUrl,
        analysis_type: analysisType,
        competitor_count: competitorCount,
        status: status,
        business_analysis: businessAnalysis,
        competitors_data: competitorsData
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating analysis history:', error);
      return NextResponse.json({ error: 'Failed to create analysis history' }, { status: 500 });
    }

    return NextResponse.json({ record: newRecord });

  } catch (error) {
    console.error('Analysis history creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}