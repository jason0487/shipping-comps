import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, websiteUrl, analysisResult } = body;

    // Log the request for debugging
    console.log('Debug endpoint called with:', { email, websiteUrl, hasAnalysisResult: !!analysisResult });

    if (!email || !analysisResult) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        received: { email: !!email, analysisResult: !!analysisResult }
      }, { status: 400 });
    }

    // Test environment variables
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasSendGrid = !!process.env.SENDGRID_API_KEY;
    const hasHubSpot = !!process.env.HUBSPOT_ACCESS_TOKEN;

    console.log('Environment check:', { hasOpenAI, hasSendGrid, hasHubSpot });

    // Simple calculation without complex template
    const competitors = analysisResult.competitors || [];
    const competitorThresholds = competitors
      .map((comp: any) => {
        const match = comp.shipping_incentives?.match(/\$(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(Boolean);
    
    const avgThreshold = competitorThresholds.length > 0 
      ? competitorThresholds.reduce((a: number, b: number) => a + b, 0) / competitorThresholds.length 
      : 75;

    console.log('Calculation check:', { 
      competitorCount: competitors.length,
      thresholds: competitorThresholds,
      avgThreshold 
    });

    // Simple email template without complex styling
    const simpleTemplate = `
    <!DOCTYPE html>
    <html>
    <head><title>Test Action Plan</title></head>
    <body>
        <h1>Test Action Plan for ${websiteUrl}</h1>
        <p>Hello ${name || 'there'},</p>
        <p>Your competitor average threshold: $${Math.round(avgThreshold)}</p>
        <p>This is a debug test email.</p>
    </body>
    </html>`;

    // Try to send email
    if (!hasSendGrid) {
      return NextResponse.json({
        error: 'SendGrid API key not configured',
        debug: { hasOpenAI, hasSendGrid, hasHubSpot, avgThreshold }
      }, { status: 500 });
    }

    const emailData = {
      personalizations: [{
        to: [{ email }],
        subject: 'Debug Action Plan Test'
      }],
      from: { email: 'yourcustomreport@ondeliveri.com', name: 'Shipping Comps Debug' },
      content: [{
        type: 'text/html',
        value: simpleTemplate
      }]
    };

    console.log('Attempting to send email to:', email);

    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    console.log('SendGrid response status:', emailResponse.status);

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('SendGrid error response:', errorText);
      return NextResponse.json({
        error: 'SendGrid API error',
        status: emailResponse.status,
        details: errorText
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Debug email sent successfully',
      debug: { avgThreshold, competitorCount: competitors.length }
    });

  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error.message,
      stack: error.stack?.slice(0, 500) // Truncate stack for response
    }, { status: 500 });
  }
}