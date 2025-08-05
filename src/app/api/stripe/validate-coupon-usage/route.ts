import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userEmail, couponCode } = await request.json();

    if (!userEmail || !couponCode) {
      return NextResponse.json(
        { error: 'User email and coupon code are required' },
        { status: 400 }
      );
    }

    // Check if user has already used this coupon
    const { data: existingUsage, error } = await supabase
      .from('coupon_usage')
      .select('id, used_at')
      .eq('user_email', userEmail)
      .eq('coupon_code', couponCode)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Database error checking coupon usage:', error);
      return NextResponse.json(
        { error: 'Database error checking coupon usage' },
        { status: 500 }
      );
    }

    const hasUsed = !!existingUsage;
    
    return NextResponse.json({
      canUse: !hasUsed,
      hasUsed,
      usedAt: existingUsage?.used_at || null,
      message: hasUsed 
        ? `Coupon ${couponCode} has already been used by this customer` 
        : `Coupon ${couponCode} is available for use`
    });

  } catch (error) {
    console.error('Error validating coupon usage:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon usage' },
      { status: 500 }
    );
  }
}