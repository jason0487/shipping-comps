import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: subscriptionId } = await params;
    const updatedData = await request.json();

    const supabase = getSupabaseClient();
    // Update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        ...updatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Database error updating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to update subscription in database' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: {
        id: subscriptionId,
        ...updatedData,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: subscriptionId } = await params;

    const supabase = getSupabaseClient();
    // Delete subscription from database
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (error) {
      console.error('Database error deleting subscription:', error);
      return NextResponse.json(
        { error: 'Failed to delete subscription from database' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}