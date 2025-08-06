import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is missing');
  }
  return new Stripe(secretKey, {
    apiVersion: '2022-11-15',
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const { packageType, successUrl, cancelUrl } = await request.json();

    // Define pricing for token packages
    const pricing = {
      'tokens_10': {
        price_data: {
          currency: 'usd',
          product_data: {
            name: '10 Analysis Tokens',
            description: 'Perfect for testing and small businesses'
          },
          unit_amount: 999, // $9.99 in cents
        },
        quantity: 1,
      },
      'tokens_30': {
        price_data: {
          currency: 'usd',
          product_data: {
            name: '30 Analysis Tokens',
            description: 'Best value for growing businesses'
          },
          unit_amount: 1999, // $19.99 in cents
        },
        quantity: 1,
      }
    };

    if (!pricing[packageType as keyof typeof pricing]) {
      return NextResponse.json(
        { error: 'Invalid package type' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [pricing[packageType as keyof typeof pricing]],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        package_type: packageType,
        tokens: packageType === 'tokens_10' ? '10' : '30'
      }
    });

    return NextResponse.json({
      checkout_url: session.url
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}