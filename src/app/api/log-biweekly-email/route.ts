import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { 
      user_email, 
      website_url, 
      report_type, 
      subscription_id,
      email_sent_successfully,
      competitor_count,
      avg_threshold
    } = await request.json();

    // Validate required fields
    if (!user_email || !website_url || !report_type) {
      return NextResponse.json({ 
        error: 'user_email, website_url, and report_type are required' 
      }, { status: 400 });
    }

    // Log to internal database
    const { data: logEntry, error: dbError } = await supabase
      .from('biweekly_email_logs')
      .insert({
        user_email,
        website_url,
        report_type,
        subscription_id: subscription_id || null,
        email_sent_successfully: email_sent_successfully || false,
        competitor_count: competitor_count || 0,
        avg_threshold: avg_threshold || 0,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database logging error:', dbError);
    }

    // Log to Google Sheets
    const sheetsLogged = await logBiweeklyEmailToSheets({
      user_email,
      website_url,
      report_type,
      subscription_id,
      email_sent_successfully,
      competitor_count,
      avg_threshold,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Bi-weekly email logged successfully',
      internal_log_id: logEntry?.id,
      google_sheets_logged: sheetsLogged
    });

  } catch (error) {
    console.error('Bi-weekly email logging error:', error);
    return NextResponse.json({ 
      error: 'Failed to log bi-weekly email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Google Sheets logging function for bi-weekly emails
async function logBiweeklyEmailToSheets(data: {
  user_email: string;
  website_url: string;
  report_type: string;
  subscription_id?: string;
  email_sent_successfully: boolean;
  competitor_count: number;
  avg_threshold: number;
  timestamp: string;
}): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_BIWEEKLY_URL || process.env.GOOGLE_APPS_SCRIPT_URL;
  
  if (!webhookUrl) {
    console.log("Warning: GOOGLE_APPS_SCRIPT_BIWEEKLY_URL not configured, using fallback");
    return false;
  }
  
  console.log(`Logging bi-weekly email to Google Sheets: ${data.website_url}`);
  
  try {
    const payload = {
      user_email: data.user_email,
      website_url: data.website_url,
      report_type: data.report_type,
      subscription_id: data.subscription_id || 'N/A',
      email_sent: data.email_sent_successfully ? 'SUCCESS' : 'FAILED',
      competitor_count: data.competitor_count,
      avg_threshold: `$${data.avg_threshold.toFixed(2)}`,
      timestamp: data.timestamp
    };
    
    console.log(`Sending bi-weekly email payload to Google Sheets:`, payload);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log(`Google Sheets bi-weekly response status: ${response.status}`);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log(`Google Sheets bi-weekly response: ${responseText}`);
      
      try {
        const result = JSON.parse(responseText);
        if (result.status === 'success') {
          console.log(`Successfully logged bi-weekly email to Google Sheets: ${data.website_url}`);
          return true;
        } else {
          console.log(`Google Sheets bi-weekly API error: ${result.message || 'Unknown error'}`);
          return false;
        }
      } catch (jsonError) {
        console.log(`Invalid JSON response from bi-weekly sheets: ${responseText}`);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log(`HTTP error logging bi-weekly email to Google Sheets: ${response.status}`);
      console.log(`Response body: ${errorText}`);
      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Network error logging bi-weekly email to Google Sheets: ${error.message}`);
    } else {
      console.error(`Unexpected error logging bi-weekly email to Google Sheets: ${error}`);
    }
    return false;
  }
}