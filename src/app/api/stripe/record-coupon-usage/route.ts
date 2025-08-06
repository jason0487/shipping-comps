import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { userEmail, couponCode, stripePaymentIntentId, stripeSubscriptionId } = await request.json();

    if (!userEmail || !couponCode) {
      return NextResponse.json(
        { error: 'User email and coupon code are required' },
        { status: 400 }
      );
    }

    // Record coupon usage
    const { data, error } = await supabase
      .from('coupon_usage')
      .insert({
        user_email: userEmail,
        coupon_code: couponCode,
        stripe_payment_intent_id: stripePaymentIntentId,
        stripe_subscription_id: stripeSubscriptionId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording coupon usage:', error);
      
      // Handle duplicate usage attempts
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Coupon has already been used by this customer' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to record coupon usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon usage recorded successfully',
      usage: data
    });

  } catch (error) {
    console.error('Error recording coupon usage:', error);
    return NextResponse.json(
      { error: 'Failed to record coupon usage' },
      { status: 500 }
    );
  }
}