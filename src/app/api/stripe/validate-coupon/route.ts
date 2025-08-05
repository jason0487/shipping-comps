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
  try {
    const { couponCode, amount, userEmail } = await request.json();

    if (!couponCode) {
      return NextResponse.json(
        { error: 'Coupon code is required', valid: false },
        { status: 400 }
      );
    }

    // Validate coupon with Stripe
    const coupon = await stripe.coupons.retrieve(couponCode);
    
    if (!coupon.valid) {
      return NextResponse.json(
        { error: 'Coupon is not valid or has expired', valid: false },
        { status: 400 }
      );
    }

    // Check per-customer usage for specific coupons (like LAUNCH50)
    if (userEmail && couponCode === 'LAUNCH50') {
      const supabase = getSupabaseClient();
      const { data: existingUsage, error } = await supabase
        .from('coupon_usage')
        .select('id, used_at')
        .eq('user_email', userEmail)
        .eq('coupon_code', couponCode)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Database error checking coupon usage:', error);
      } else if (existingUsage) {
        return NextResponse.json(
          { 
            error: `Coupon ${couponCode} has already been used by this customer`, 
            valid: false,
            alreadyUsed: true,
            usedAt: existingUsage.used_at
          },
          { status: 400 }
        );
      }
    }

    // Calculate discount
    let discountAmount = 0;
    let finalAmount = amount;

    if (coupon.percent_off) {
      // Percentage discount
      discountAmount = (amount * coupon.percent_off) / 100;
      finalAmount = Math.max(0, amount - discountAmount);
    } else if (coupon.amount_off) {
      // Fixed amount discount (convert from cents to dollars)
      discountAmount = coupon.amount_off / 100;
      finalAmount = Math.max(0, amount - discountAmount);
    }

    // For 100% off coupons, ensure final amount is 0
    if (finalAmount < 0.01) {
      finalAmount = 0;
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        name: coupon.name || coupon.id,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
        valid: coupon.valid,
      },
      originalAmount: amount,
      discountAmount,
      finalAmount,
    });

  } catch (error: any) {
    console.error('Coupon validation error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid coupon code', valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to validate coupon', valid: false },
      { status: 500 }
    );
  }
}