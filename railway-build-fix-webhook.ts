import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

// Move Supabase initialization inside function to avoid build-time errors
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();
    
    switch (event.type) {
      case 'invoice.payment_succeeded':
        // Handle subscription payment success - this is the key event for subscriptions!
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);
        console.log('Invoice metadata:', invoice.metadata);
        console.log('Invoice subscription:', invoice.subscription);
        
        if (invoice.subscription) {
          // Get the subscription to access its metadata
          const invoiceSubscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          console.log('Retrieved subscription metadata:', invoiceSubscription.metadata);
          
          const { website_url, user_email, monitoring_url, monitored_url } = invoiceSubscription.metadata;
          const finalWebsiteUrl = website_url || monitoring_url || monitored_url;
          
          if (finalWebsiteUrl && user_email) {
            console.log(`Processing subscription payment for ${user_email}, website: ${finalWebsiteUrl}`);
            
            // Find user by email
            const { data: user } = await supabase
              .from('users')
              .select('id')
              .eq('email', user_email)
              .single();

            if (user) {
              // Check if subscription already exists
              const { data: existingSubscription } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('stripe_subscription_id', invoiceSubscription.id)
                .single();

              if (!existingSubscription) {
                // Create subscription record
                const { data: subscriptionData, error: subscriptionError } = await supabase
                  .from('subscriptions')
                  .insert({
                    user_id: user.id,
                    website_url: finalWebsiteUrl,
                    subscription_type: 'biweekly_reports',
                    stripe_subscription_id: invoiceSubscription.id,
                    stripe_customer_id: invoiceSubscription.customer as string,
                    is_active: invoiceSubscription.status === 'active',
                    price_monthly: 3.99,
                    next_report_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .select()
                  .single();

                if (subscriptionError) {
                  console.error('Error creating subscription:', subscriptionError);
                } else {
                  console.log('Subscription created successfully:', subscriptionData);
                  
                  // Generate welcome report asynchronously
                  try {
                    console.log('Generating welcome report for new subscription...');
                    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-biweekly-report`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        website_url: finalWebsiteUrl,
                        user_email: user_email,
                        report_type: 'welcome'
                      }),
                    });
                    
                    if (response.ok) {
                      console.log('Welcome report generation initiated successfully');
                    } else {
                      console.error('Failed to generate welcome report:', response.status);
                    }
                  } catch (error) {
                    console.error('Error generating welcome report:', error);
                  }
                }
              } else {
                console.log('Subscription already exists:', existingSubscription);
              }
            } else {
              console.error('User not found for email:', user_email);
            }
          } else {
            console.error('Missing website_url or user_email in subscription metadata');
          }
        }
        break;

      case 'customer.subscription.created':
        // Handle subscription creation
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);
        console.log('Subscription metadata:', subscription.metadata);
        
        const { website_url, user_email, monitoring_url, monitored_url } = subscription.metadata;
        const finalWebsiteUrl = website_url || monitoring_url || monitored_url;
        
        if (finalWebsiteUrl && user_email) {
          console.log(`Processing subscription creation for ${user_email}, website: ${finalWebsiteUrl}`);
          
          // Find user by email
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', user_email)
            .single();

          if (user) {
            // Check if subscription already exists
            const { data: existingSubscription } = await supabase
              .from('subscriptions')
              .select('id')
              .eq('stripe_subscription_id', subscription.id)
              .single();

            if (!existingSubscription) {
              // Create subscription record
              const { data: subscriptionData, error: subscriptionError } = await supabase
                .from('subscriptions')
                .insert({
                  user_id: user.id,
                  website_url: finalWebsiteUrl,
                  subscription_type: 'biweekly_reports',
                  stripe_subscription_id: subscription.id,
                  stripe_customer_id: subscription.customer as string,
                  is_active: subscription.status === 'active',
                  price_monthly: 3.99,
                  next_report_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (subscriptionError) {
                console.error('Error creating subscription:', subscriptionError);
              } else {
                console.log('Subscription created successfully:', subscriptionData);
              }
            } else {
              console.log('Subscription already exists:', existingSubscription);
            }
          } else {
            console.error('User not found for email:', user_email);
          }
        } else {
          console.error('Missing website_url or user_email in subscription metadata');
        }
        break;

      case 'payment_intent.succeeded':
        // Handle one-time payment success for token purchases
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent succeeded:', paymentIntent.id);
        console.log('Payment metadata:', paymentIntent.metadata);
        
        const paymentUserEmail = paymentIntent.metadata.user_email;
        const tokensString = paymentIntent.metadata.tokens;
        const coupon_id = paymentIntent.metadata.coupon_id;
        
        if (paymentUserEmail && tokensString) {
          const tokens = parseInt(tokensString);
          console.log(`Processing token purchase: ${tokens} tokens for ${paymentUserEmail}`);
          
          // Find user
          const { data: customUser, error: customUserError } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', paymentUserEmail)
            .single();

          if (customUserError) {
            console.error('Error finding user for payment:', customUserError);
            break;
          }

          const user = customUser;
          
          if (user) {
            // Check if payment already processed
            const { data: existingPayment } = await supabase
              .from('payment_history')
              .select('id')
              .eq('stripe_payment_intent_id', paymentIntent.id)
              .single();

            if (!existingPayment) {
              // Record coupon usage if coupon was used
              if (coupon_id) {
                console.log(`Recording coupon usage: ${coupon_id} for ${paymentUserEmail}`);
                const { error: couponError } = await supabase
                  .from('coupon_usage')
                  .insert({
                    user_email: paymentUserEmail,
                    coupon_code: coupon_id,
                    stripe_payment_intent_id: paymentIntent.id,
                  })
                  .select()
                  .single();

                if (couponError) {
                  console.error('Error recording coupon usage:', couponError);
                } else {
                  console.log('Coupon usage recorded successfully');
                }
              }

              // Add tokens to user account
              const { data: tokenData, error: tokenError } = await supabase
                .from('user_tokens')
                .insert({
                  user_id: user.id,
                  tokens_remaining: tokens,
                  tokens_purchased: tokens,
                  stripe_payment_intent_id: paymentIntent.id,
                  purchase_date: new Date().toISOString(),
                  created_at: new Date().toISOString()
                })
                .select()
                .single();

              if (tokenError) {
                console.error('Error adding tokens:', tokenError);
              } else {
                console.log('Tokens added successfully:', tokenData);
              }
            } else {
              console.log('Payment already processed:', existingPayment);
            }
          } else {
            console.error('User not found for payment:', paymentUserEmail);
          }
        } else {
          console.log('Payment intent missing required metadata');
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}