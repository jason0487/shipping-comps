import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is missing');
  }
  return new Stripe(secretKey, {
    apiVersion: '2022-11-15',
  });
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        // Handle subscription payment success - this is the key event for subscriptions!
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);
        console.log('Invoice metadata:', invoice.metadata);
        console.log('Invoice subscription:', invoice.subscription);
        
        if (invoice.subscription) {
          // Get the subscription to access its metadata
          const stripe2 = getStripeClient();
          const invoiceSubscription = await stripe2.subscriptions.retrieve(invoice.subscription as string);
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
                console.log('Subscription already exists, skipping creation');
              }
            } else {
              console.error('User not found for subscription payment:', user_email);
            }
          } else {
            console.log('Missing website_url or user_email in subscription metadata');
          }
        }
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);
        console.log('Subscription metadata:', subscription.metadata);
        
        // Handle subscription creation webhook - check both possible metadata keys
        const { website_url, user_email, monitoring_url, monitored_url } = subscription.metadata;
        const finalWebsiteUrl = website_url || monitoring_url || monitored_url;
        
        if (finalWebsiteUrl && user_email) {
          console.log(`Processing subscription for ${user_email}, website: ${finalWebsiteUrl}`);
          
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
                console.log('Successfully created subscription:', subscriptionData);
                
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
              console.log('Subscription already exists:', subscription.id);
            }
          } else {
            console.error('User not found for subscription:', user_email);
          }
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        console.log('Payment metadata:', paymentIntent.metadata);
        
        // Extract metadata
        const { package_type, user_email: paymentUserEmail, coupon_id } = paymentIntent.metadata;
        
        if (package_type && paymentUserEmail) {
          // Determine tokens based on package type
          let tokens = 0;
          if (package_type === 'tokens_5') tokens = 5;
          else if (package_type === 'tokens_10') tokens = 10;
          else if (package_type === 'tokens_20') tokens = 20;
          else if (package_type === 'tokens_30') tokens = 30;
          
          if (tokens > 0) {
            console.log(`Processing payment for ${paymentUserEmail}, package: ${package_type}, tokens: ${tokens}`);
            
            // Find user by email (try both possible user tables)
            let user = null;
            let userError = null;
            
            // First try the custom users table
            const { data: customUser, error: customUserError } = await supabase
              .from('users')
              .select('id, email')
              .eq('email', paymentUserEmail)
              .single();
            
            if (customUser && !customUserError) {
              user = customUser;
              console.log('Found user in custom users table:', user.id);
            } else {
              console.log('User not found in custom table, error:', customUserError);
            }
            
            if (user) {
              // Check if this payment was already processed
              const { data: existingPayment } = await supabase
                .from('payment_history')
                .select('id')
                .eq('stripe_payment_intent_id', paymentIntent.id)
                .single();
              
              if (existingPayment) {
                console.log('Payment already processed, skipping:', paymentIntent.id);
                return NextResponse.json({ received: true });
              }
              
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
                  console.log(`✅ Coupon usage recorded: ${coupon_id}`);
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
              
              if (!tokenError && tokenData) {
                console.log(`Successfully added ${tokens} tokens to user ${paymentUserEmail}`, tokenData);
                
                // Log payment history
                const { data: paymentData, error: paymentError } = await supabase
                  .from('payment_history')
                  .insert({
                    user_id: user.id,
                    stripe_payment_intent_id: paymentIntent.id,
                    amount: paymentIntent.amount / 100,
                    currency: paymentIntent.currency.toUpperCase(),
                    payment_type: package_type,
                    tokens_purchased: tokens,
                    payment_status: 'completed',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .select()
                  .single();
                
                if (!paymentError) {
                  console.log('Payment history logged successfully:', paymentData);
                } else {
                  console.error('Error logging payment history:', paymentError);
                }
              } else {
                console.error('Error adding tokens:', tokenError);
              }
            } else {
              console.error('User not found in any table:', paymentUserEmail);
            }
          }
        }
        break;
        
      case 'invoice.payment_succeeded':
        const subscriptionInvoice = event.data.object as Stripe.Invoice;
        console.log('Subscription payment succeeded:', subscriptionInvoice.id);
        console.log('Invoice details:', JSON.stringify(subscriptionInvoice, null, 2));
        
        // Handle subscription payments
        if (subscriptionInvoice.subscription) {
          const stripe3 = getStripeClient();
          const subscription = await stripe3.subscriptions.retrieve(subscriptionInvoice.subscription as string);
          console.log('Subscription metadata:', JSON.stringify(subscription.metadata, null, 2));
          const { website_url, monitored_url } = subscription.metadata;
          
          // Use either website_url or monitored_url key (for compatibility)
          const websiteUrl = website_url || monitored_url;
          console.log('Found website URL:', websiteUrl);
          console.log('Customer email:', subscriptionInvoice.customer_email);
          
          if (websiteUrl && subscriptionInvoice.customer_email) {
            // Find user by email
            const { data: user, error: userError } = await supabase
              .from('users')
              .select('id')
              .eq('email', subscriptionInvoice.customer_email)
              .single();
            
            if (user && !userError) {
              // Update or create subscription record
              const { error: subError } = await supabase
                .from('subscriptions')
                .upsert({
                  user_id: user.id,
                  subscription_type: 'biweekly_report',
                  website_url: websiteUrl,
                  is_active: true,
                  stripe_subscription_id: subscription.id,
                  current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                  current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  next_report_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
                }, {
                  onConflict: 'user_id,website_url'
                });
              
              if (!subError) {
                console.log(`✅ Successfully updated subscription for user ${subscriptionInvoice.customer_email} monitoring ${websiteUrl}`);
                
                // Add subscription payment to payment history
                const { error: paymentHistoryError } = await supabase
                  .from('payment_history')
                  .insert({
                    user_id: user.id,
                    stripe_payment_intent_id: `sub_${subscription.id}`,
                    amount: subscriptionInvoice.amount_paid / 100,
                    currency: subscriptionInvoice.currency.toUpperCase(),
                    payment_type: 'subscription_biweekly',
                    tokens_purchased: 0,
                    payment_status: 'completed',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });
                
                if (!paymentHistoryError) {
                  console.log('✅ Subscription payment added to history');
                } else {
                  console.error('❌ Error adding subscription to payment history:', paymentHistoryError);
                }
              } else {
                console.error('❌ Error updating subscription:', subError);
              }
            } else {
              console.error('❌ User not found for email:', subscriptionInvoice.customer_email);
            }
          } else {
            console.log('⚠️ Missing data - websiteUrl:', websiteUrl, 'customer_email:', subscriptionInvoice.customer_email);
          }
        } else {
          console.log('⚠️ No subscription ID found in invoice');
        }
        break;
        
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription cancelled/deleted:', deletedSubscription.id);
        
        const supabase = getSupabaseClient();
        
        // Update subscription status in database
        const { error: cancelError } = await supabase
          .from('subscriptions')
          .update({ 
            is_active: false,
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', deletedSubscription.id);
        
        if (cancelError) {
          console.error('Error updating cancelled subscription:', cancelError);
        } else {
          console.log('Successfully marked subscription as cancelled:', deletedSubscription.id);
        }
        break;
        
      case 'customer.subscription.updated':
        // Handle subscription status changes (active/cancelled/paused)
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', updatedSubscription.id, 'status:', updatedSubscription.status);
        
        const supabase2 = getSupabaseClient();
        
        // Update subscription status based on Stripe status
        const updateData: any = {
          is_active: updatedSubscription.status === 'active',
          updated_at: new Date().toISOString()
        };
        
        if (updatedSubscription.status === 'canceled' || updatedSubscription.status === 'cancelled') {
          updateData.status = 'cancelled';
          updateData.cancelled_at = new Date().toISOString();
        } else {
          updateData.status = updatedSubscription.status;
        }
        
        const { error: updateError } = await supabase2
          .from('subscriptions')
          .update(updateData)
          .eq('stripe_subscription_id', updatedSubscription.id);
        
        if (updateError) {
          console.error('Error updating subscription status:', updateError);
        } else {
          console.log('Successfully updated subscription status:', updatedSubscription.id, 'to', updatedSubscription.status);
        }
        break;

      case 'invoice.payment_failed':
        console.log('Payment failed for invoice:', event.data.object.id);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}