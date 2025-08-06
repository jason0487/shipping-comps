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
  try {
    const stripe = getStripeClient();
    const supabase = getSupabaseClient();
    const { amount, packageType, couponId, userEmail } = await request.json();

    // Validate user email is provided
    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    // Find or create user in database
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    // If user doesn't exist, create them (this handles new users purchasing tokens)
    if (userError || !user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          email: userEmail,
        })
        .select('id, email')
        .single();

      if (createError || !newUser) {
        console.error('Failed to create user:', createError);
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
      }
      
      user = newUser;
      console.log('Created new user for token purchase:', userEmail);
    }

    // Convert to cents with proper decimal handling
    const amountInCents = Math.round(parseFloat(amount.toFixed(2)) * 100);
    
    console.log('Payment intent request:', { amount, packageType, amountInCents });

    // Create payment intent with optional coupon
    const paymentIntentData: any = {
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        package_type: packageType,
        user_email: userEmail,
      },
    };

    // Add coupon if provided
    if (couponId) {
      paymentIntentData.metadata.coupon_id = couponId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error',
        amount,
        packageType,
        amountInCents: Math.round(parseFloat(amount.toFixed(2)) * 100)
      },
      { status: 500 }
    );
  }
}