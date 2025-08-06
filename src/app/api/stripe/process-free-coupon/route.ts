import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const supabase = getSupabaseClient();
    const { packageType, tokens, couponId, userEmail } = await request.json();

    if (!packageType || !tokens || !couponId || !userEmail) {
      return NextResponse.json(
        { error: 'Package type, tokens, coupon ID, and user email are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (!user || userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add tokens to user account
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .insert({
        user_id: user.id,
        tokens_remaining: tokens,
        tokens_purchased: tokens,
        stripe_payment_intent_id: `free_coupon_${couponId}_${Date.now()}`,
        purchase_date: new Date().toISOString(),
      });

    if (tokenError) {
      console.error('Error adding tokens:', tokenError);
      return NextResponse.json({ error: 'Failed to add tokens' }, { status: 500 });
    }

    // Log payment history
    await supabase
      .from('payment_history')
      .insert({
        user_id: user.id,
        stripe_payment_intent_id: `free_coupon_${couponId}_${Date.now()}`,
        amount: 0,
        currency: 'USD',
        payment_type: packageType,
        tokens_purchased: tokens,
        payment_status: 'completed',
      });

    console.log(`Added ${tokens} free tokens to user ${userEmail} using coupon ${couponId}`);

    return NextResponse.json({ 
      success: true, 
      message: `${tokens} tokens added successfully` 
    });

  } catch (error) {
    console.error('Error processing free coupon:', error);
    return NextResponse.json(
      { error: 'Failed to process free coupon' },
      { status: 500 }
    );
  }
}