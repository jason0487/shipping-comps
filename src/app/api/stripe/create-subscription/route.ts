import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use live or test key based on environment
const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_API_KEY;

if (!stripeKey) {
  throw new Error('Missing Stripe secret key in environment variables');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2022-11-15',
});

console.log('🔑 STRIPE KEY MODE v6.1.1:', {
  key_starts_with: stripeKey.substring(0, 12),
  is_test: stripeKey.startsWith('sk_test_'),
  is_live: stripeKey.startsWith('sk_live_'),
  env_var: process.env.STRIPE_SECRET_KEY?.substring(0, 12),
  env_var_length: process.env.STRIPE_SECRET_KEY?.length,
  timestamp: new Date().toISOString()
});

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, userEmail, couponId, finalAmount } = await request.json();

    if (!websiteUrl || !userEmail) {
      return NextResponse.json(
        { error: 'Website URL and user email are required' },
        { status: 400 }
      );
    }

    // Create or retrieve customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
      });
    }

    // Use a single reusable product for all bi-weekly reports
    let product;
    const existingProducts = await stripe.products.list({
      limit: 1,
      active: true,
    });
    
    // Look for existing bi-weekly report product
    const existingProduct = existingProducts.data.find(p => 
      p.name === 'Bi-Weekly Website Monitoring' && p.active
    );
    
    if (existingProduct) {
      product = existingProduct;
    } else {
      // Create the reusable product
      product = await stripe.products.create({
        name: 'Bi-Weekly Website Monitoring',
        description: 'Automated competitor shipping analysis reports delivered every two weeks',
        metadata: {
          service_type: 'shipping_analysis',
          report_frequency: 'bi_weekly',
        },
      });
    }

    // Use a single reusable price for all subscriptions
    let price;
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 1,
    });
    
    if (existingPrices.data.length > 0) {
      price = existingPrices.data[0];
    } else {
      price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: Math.round((finalAmount || 3.99) * 100),
        recurring: {
          interval: 'month',
        },
        product: product.id,
      });
    }

    // Create a SetupIntent for subscription payment method collection
    const setupIntentParams: any = {
      customer: customer.id,
      usage: 'off_session', // For future payments
      payment_method_types: ['card'],
      metadata: {
        // Store data needed for subscription creation
        website_url: websiteUrl,
        user_email: userEmail,
        price_id: price.id,
        subscription_type: 'biweekly_reports',
        service_description: `Bi-weekly shipping analysis for ${websiteUrl}`,
        ...(couponId && { coupon_applied: couponId }),
      },
    };

    const setupIntent = await stripe.setupIntents.create(setupIntentParams);

    // Store subscription details in metadata for later completion
    const subscriptionData = {
      customer_id: customer.id,
      price_id: price.id,
      website_url: websiteUrl,
      ...(couponId && { coupon_id: couponId }),
    };

    return NextResponse.json({
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id,
      subscription_data: subscriptionData,
      customer_id: customer.id,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}