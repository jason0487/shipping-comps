import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, websiteUrl, userEmail } = await request.json();

    if (!subscriptionId || !websiteUrl || !userEmail) {
      return NextResponse.json(
        { error: 'Subscription ID, website URL, and user email are required' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll simulate activating the subscription with a test payment method
    // In production, this would be handled by Stripe webhooks after real payment confirmation
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      default_payment_method: 'pm_card_visa', // Test payment method
      metadata: {
        website_url: websiteUrl,
        subscription_type: 'biweekly_reports',
        status: 'active',
      },
    });

    // TODO: Save to local database if needed
    // This would typically be done via Stripe webhooks in production

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      status: subscription.status,
    });
  } catch (error) {
    console.error('Error activating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to activate subscription' },
      { status: 500 }
    );
  }
}