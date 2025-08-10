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
    console.log('Starting overdue reports check...');
    
    const supabase = getSupabaseClient();
    const now = new Date();
    
    // Get all active subscriptions that are overdue
    const { data: overdueSubscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        website_url,
        next_report_date,
        created_at,
        users!inner (
          email
        )
      `)
      .eq('is_active', true)
      .lt('next_report_date', now.toISOString());

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`Found ${overdueSubscriptions?.length || 0} overdue subscriptions`);

    if (!overdueSubscriptions || overdueSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No overdue reports found',
        processedCount: 0,
        details: 'All subscriptions are up to date'
      });
    }

    const results = [];
    
    // Process each overdue subscription
    for (const subscription of overdueSubscriptions) {
      try {
        console.log(`Processing subscription ${subscription.id} for ${subscription.website_url}`);
        
        // Calculate how many reports we need to send
        const subscriptionDate = new Date(subscription.created_at);
        const nextReportDate = new Date(subscription.next_report_date);
        const daysSinceLastReport = Math.floor((now.getTime() - nextReportDate.getTime()) / (1000 * 60 * 60 * 24));
        const missedReports = Math.floor(daysSinceLastReport / 14) + 1;
        
        console.log(`Subscription is ${daysSinceLastReport} days overdue, sending ${missedReports} report(s)`);
        
        // Generate the current bi-weekly report
        const reportResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/generate-biweekly-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription_id: subscription.id,
            website_url: subscription.website_url,
            user_email: (subscription.users as any).email,
            report_type: 'overdue_biweekly',
            missed_reports: missedReports
          })
        });

        const reportResult = await reportResponse.json();
        
        if (reportResult.success) {
          // Update next report date to the next bi-weekly cycle from now
          const nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + 14);
          
          await supabase
            .from('subscriptions')
            .update({ 
              next_report_date: nextDate.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', subscription.id);

          results.push({
            subscription_id: subscription.id,
            website_url: subscription.website_url,
            user_email: (subscription.users as any).email,
            status: 'success',
            missed_reports: missedReports,
            days_overdue: daysSinceLastReport,
            new_next_report_date: nextDate.toISOString()
          });

          console.log(`✅ Successfully sent overdue report for ${subscription.website_url}`);
        } else {
          results.push({
            subscription_id: subscription.id,
            website_url: subscription.website_url,
            user_email: (subscription.users as any).email,
            status: 'failed',
            error: reportResult.error,
            missed_reports: missedReports,
            days_overdue: daysSinceLastReport
          });

          console.log(`❌ Failed to send overdue report for ${subscription.website_url}: ${reportResult.error}`);
        }
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        results.push({
          subscription_id: subscription.id,
          website_url: subscription.website_url,
          user_email: (subscription.users as any).email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    console.log(`Completed overdue reports processing: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} overdue subscriptions`,
      processedCount: results.length,
      successCount,
      failureCount,
      results
    });

  } catch (error) {
    console.error('Error sending overdue reports:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send overdue reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}