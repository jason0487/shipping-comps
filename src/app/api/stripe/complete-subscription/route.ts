import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripeClient() {
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_API_KEY;
  
  if (!stripeKey) {
    throw new Error('Missing Stripe secret key in environment variables');
  }
  
  console.log('🔑 COMPLETE-SUBSCRIPTION STRIPE KEY MODE:', {
    key_starts_with: stripeKey.substring(0, 12),
    is_test: stripeKey.startsWith('sk_test_'),
    is_live: stripeKey.startsWith('sk_live_')
  });
  
  return new Stripe(stripeKey, {
    apiVersion: '2022-11-15',
  });
}

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const supabase = getSupabaseClient();
    const requestBody = await request.json();
    console.log('🔄 RAW REQUEST BODY RECEIVED:', requestBody);
    
    const { setup_intent_id, payment_method_id } = requestBody;
    console.log('🔄 EXTRACTED VALUES:', { setup_intent_id, payment_method_id });
    console.log('🔄 TYPES:', { 
      setup_intent_id_type: typeof setup_intent_id, 
      payment_method_id_type: typeof payment_method_id 
    });

    if (!setup_intent_id || !payment_method_id) {
      console.error('Missing required parameters:', { setup_intent_id, payment_method_id });
      return NextResponse.json(
        { error: 'Setup intent ID and payment method ID are required' },
        { status: 400 }
      );
    }

    // Retrieve the setup intent to get metadata
    const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id);
    console.log('🔍 SetupIntent metadata:', setupIntent.metadata);
    const { website_url, price_id, coupon_id, user_email } = setupIntent.metadata;

    if (!website_url) {
      return NextResponse.json(
        { error: 'Missing website URL in setup intent' },
        { status: 400 }
      );
    }

    // Use default price if not provided
    const actualPriceId = price_id || process.env.STRIPE_SUBSCRIPTION_PRICE_ID || 'price_1234567890';

    // Create subscription with URL-specific metadata directly on the subscription transaction
    const subscriptionParams: any = {
      customer: setupIntent.customer as string,
      items: [{
        price: actualPriceId,
      }],
      default_payment_method: payment_method_id,
      description: `Bi-weekly shipping analysis for ${website_url}`,
      metadata: {
        // Primary key for ChatGPT's per-URL architecture
        monitored_url: website_url,
        // Backup keys for compatibility
        website_url: website_url,
        user_email: user_email,
        // Service identification
        subscription_type: 'biweekly_reports',
        service_type: 'shipping_analysis',
        report_frequency: 'bi_weekly',
        // Tracking
        setup_intent_id: setup_intent_id,
        created_at: new Date().toISOString(),
        created_via: 'shipping_comps_app',
      },
    };

    // Add coupon if provided
    if (coupon_id) {
      subscriptionParams.coupon = coupon_id;
    }

    // Create the subscription
    console.log('🚀 Creating subscription with params:', subscriptionParams);
    const subscription = await stripe.subscriptions.create(subscriptionParams);
    console.log('✅ Subscription created successfully:', subscription.id, subscription.status);

    // Store subscription in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user_email)
      .single();

    console.log('User lookup result:', { user, userError });

    if (user) {
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          id: crypto.randomUUID(), // Generate UUID for the subscription
          user_id: user.id,
          website_url,
          subscription_type: 'biweekly_reports',
          stripe_subscription_id: subscription.id,
          is_active: true,
          price_monthly: 3.99,
          next_report_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      console.log('Database subscription insert result:', { subscriptionData, subscriptionError });
      
      if (subscriptionError) {
        console.error('Failed to save subscription to database:', subscriptionError);
        // Continue anyway since Stripe subscription was created
      } else {
        // Generate immediate welcome report for the subscribed website (asynchronously)
        console.log('🎉 Triggering immediate welcome report for:', website_url);
        
        // Don't await the report generation - let it run in background
        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:5000'}/api/generate-biweekly-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            website_url,
            user_email,
            report_type: 'welcome_report'
          }),
        }).then(reportResponse => {
          if (reportResponse.ok) {
            console.log('✅ Welcome report generated successfully');
          } else {
            console.log('⚠️ Welcome report generation failed, will retry on next cycle');
          }
        }).catch(reportError => {
          console.error('Welcome report generation error:', reportError);
          // Don't fail the subscription if report generation fails
        });
        
        console.log('🚀 Welcome report generation started in background');
      }
    } else {
      console.error('User not found for email:', user_email);
    }

    // Add session refresh hint to prevent logout
    const response = NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      status: subscription.status,
      message: 'Subscription created successfully'
    });
    
    // Add cache control headers to prevent session issues
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('❌ SUBSCRIPTION ERROR:', error);
    console.error('❌ SUBSCRIPTION ERROR DETAILS:', JSON.stringify(error, null, 2));
    console.error('❌ SUBSCRIPTION ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to complete subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}