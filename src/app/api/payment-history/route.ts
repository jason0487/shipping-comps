import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch payment history for the user
    const { data: payments, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10); // Last 10 transactions

    if (error) {
      console.error('Error fetching payment history:', error);
      return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
    }

    // Format payment data for display with real card details
    const formattedPayments = await Promise.all(
      (payments || []).map(async (payment) => {
        let cardLast4 = '****';
        let paymentMethod = 'Unknown';
        let cardBrand = '';

        if (payment.stripe_payment_intent_id?.includes('free_')) {
          cardLast4 = 'FREE';
          paymentMethod = 'Coupon';
        } else if (payment.stripe_payment_intent_id?.includes('pi_')) {
          try {
            // Fetch payment intent details from Stripe
            const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
            
            if (paymentIntent.payment_method) {
              // Fetch payment method details
              const paymentMethodDetails = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string);
              
              if (paymentMethodDetails.card) {
                cardLast4 = paymentMethodDetails.card.last4;
                cardBrand = paymentMethodDetails.card.brand?.toUpperCase() || '';
                paymentMethod = 'Card';
              }
            }
          } catch (error) {
            console.error('Error fetching Stripe payment details:', error);
            // Fallback to payment intent ID last 4 digits
            cardLast4 = payment.stripe_payment_intent_id.slice(-4);
            paymentMethod = 'Card';
          }
        }

        return {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          paymentType: payment.payment_type,
          tokensPurchased: payment.tokens_purchased,
          status: payment.payment_status,
          date: payment.created_at,
          cardLast4,
          paymentMethod,
          cardBrand,
        };
      })
    );

    return NextResponse.json({ payments: formattedPayments });
  } catch (error) {
    console.error('Payment history API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}