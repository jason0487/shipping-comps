import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripeClient() {
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_API_KEY;
  
  if (!stripeKey) {
    throw new Error('Missing Stripe secret key in environment variables');
  }
  
  return new Stripe(stripeKey, {
    apiVersion: '2022-11-15',
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const { couponId, percentOff, name, maxRedemptionsPerCustomer, maxRedemptions } = await request.json();

    if (!couponId || !percentOff) {
      return NextResponse.json(
        { error: 'Coupon ID and percent off are required' },
        { status: 400 }
      );
    }

    // Check if coupon already exists and delete it first
    try {
      await stripe.coupons.retrieve(couponId);
      console.log('Existing coupon found, deleting it first...');
      await stripe.coupons.del(couponId);
      console.log('Existing coupon deleted successfully');
    } catch (error: any) {
      if (error.code !== 'resource_missing') {
        console.log('Error checking existing coupon:', error.message);
      }
    }

    // Create the coupon in Stripe with usage restrictions
    const couponData: any = {
      id: couponId,
      percent_off: percentOff,
      name: name || couponId,
      duration: 'forever',
    };

    // Add global usage restrictions if provided
    if (maxRedemptions) {
      couponData.max_redemptions = maxRedemptions;
    }
    
    // Note: Stripe doesn't support per-customer limits at coupon level
    // Per-customer usage tracking must be handled at application level

    const coupon = await stripe.coupons.create(couponData);

    console.log('✅ Coupon created successfully:', coupon.id);

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        name: coupon.name,
        percent_off: coupon.percent_off,
        valid: coupon.valid,
      }
    });

  } catch (error: any) {
    console.error('Coupon creation error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      if (error.code === 'resource_already_exists') {
        return NextResponse.json(
          { error: 'Coupon already exists', success: false },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create coupon', success: false },
      { status: 500 }
    );
  }
}