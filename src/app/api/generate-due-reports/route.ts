import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST() {
  try {
    const supabase = getSupabaseClient();
    // Get all subscriptions that are due for reports
    const { data: dueSubscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        website_url,
        next_report_date,
        users!inner (
          email
        )
      `)
      .eq('is_active', true)
      .lte('next_report_date', new Date().toISOString());

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!dueSubscriptions || dueSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No due reports found',
        processedCount: 0
      });
    }

    const results = [];
    
    // Generate report for each due subscription
    for (const subscription of dueSubscriptions) {
      try {
        const reportResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/generate-biweekly-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription_id: subscription.id,
            website_url: subscription.website_url,
            user_email: (subscription.users as any).email,
            report_type: 'biweekly'
          })
        });

        const reportResult = await reportResponse.json();
        
        if (reportResult.success) {
          // Update next report date (add 14 days)
          const nextDate = new Date(subscription.next_report_date);
          nextDate.setDate(nextDate.getDate() + 14);
          
          await supabase
            .from('subscriptions')
            .update({ 
              next_report_date: nextDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);

          results.push({
            subscription_id: subscription.id,
            website_url: subscription.website_url,
            status: 'success',
            next_report_date: nextDate.toISOString()
          });
        } else {
          results.push({
            subscription_id: subscription.id,
            website_url: subscription.website_url,
            status: 'failed',
            error: reportResult.error
          });
        }
      } catch (error) {
        results.push({
          subscription_id: subscription.id,
          website_url: subscription.website_url,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} due reports`,
      processedCount: results.length,
      results
    });

  } catch (error) {
    console.error('Error generating due reports:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate due reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}