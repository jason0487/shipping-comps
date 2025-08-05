'use client';

import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
// Note: Using custom Stripe Elements implementation to avoid React 19 compatibility issues

// Initialize Stripe with environment variable - FORCE LIVE KEY
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RfjufPIJcd92wGMmemWiUrXtudcDGILSWBPmcFPR6bBdEOuansJajaooj5T4Elv4AgDDhiKlYZp7mANtTDr6fU100yrqIlebL';
const stripePromise = loadStripe(publishableKey);

console.log('🔑 FRONTEND STRIPE KEY v6.1.1:', {
  key_starts_with: publishableKey.substring(0, 15),
  is_test: publishableKey.startsWith('pk_test_'),
  is_live: publishableKey.startsWith('pk_live_'),
  env_key_starts_with: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 15),
  env_key_full_length: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.length,
  timestamp: new Date().toISOString()
});

// Global cache to prevent duplicate subscription creation
const activeSubscriptionCreations = new Map<string, Promise<any>>();

// Advanced Stripe Elements Form Component for Subscriptions
function SubscriptionStripeElementsForm({ 
  clientSecret, 
  finalAmount, 
  onSuccess, 
  onError, 
  processing, 
  setProcessing,
  websiteUrl
}: { 
  clientSecret: string;
  finalAmount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  websiteUrl: string;
}) {
  const [cardholderName, setCardholderName] = useState('');
  const [stripeElements, setStripeElements] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);

  useEffect(() => {
    const initializeStripeElements = async () => {
      const stripe = await stripePromise;
      if (!stripe || !clientSecret) return;

      // Create Elements instance
      const elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#ea580c', // Orange theme
            borderRadius: '8px',
          },
        },
      });

      // Create and mount the card element
      const cardEl = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
        },
      });

      // Mount the card element
      const cardContainer = document.getElementById('subscription-card-element');
      if (cardContainer) {
        cardEl.mount('#subscription-card-element');
        setCardElement(cardEl);
        setStripeElements({ stripe, elements, cardElement: cardEl });
      }
    };

    initializeStripeElements();

    // Cleanup
    return () => {
      if (cardElement) {
        cardElement.unmount();
      }
    };
  }, [clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripeElements || !clientSecret) {
      onError('Stripe not loaded. Please refresh the page.');
      return;
    }

    console.log('SubscriptionPaymentModal v2.3 - Stripe Elements subscription payment:', new Date().toISOString());
    
    setProcessing(true);

    try {
      const { stripe, cardElement: cardEl } = stripeElements;
      
      console.log('🔄 CONFIRMING SETUP INTENT with clientSecret:', clientSecret);
      
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardEl,
          billing_details: {
            name: cardholderName || 'Anonymous',
          },
        }
      });
      
      console.log('📋 STRIPE CONFIRM RESPONSE:', { error, setupIntent });

      if (error) {
        console.error('Subscription setup failed:', error);
        onError(error.message || 'Subscription setup failed');
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        console.log('✅ SETUP INTENT SUCCEEDED:', setupIntent);
        console.log('✅ SETUP INTENT ID:', setupIntent.id);
        console.log('✅ PAYMENT METHOD ID:', setupIntent.payment_method);
        
        // Ensure we have the required IDs
        if (!setupIntent.id || !setupIntent.payment_method) {
          console.error('❌ MISSING IDs - setupIntent.id:', setupIntent.id, 'setupIntent.payment_method:', setupIntent.payment_method);
          onError('Missing payment setup information. Please try again.');
          return;
        }
        
        // Now create the actual subscription with the confirmed payment method
        console.log('🔄 CALLING COMPLETE-SUBSCRIPTION API with:', {
          setup_intent_id: setupIntent.id,
          payment_method_id: setupIntent.payment_method,
        });
        
        const requestBody = {
          setup_intent_id: setupIntent.id,
          payment_method_id: setupIntent.payment_method,
        };
        
        console.log('🔄 REQUEST BODY being sent:', requestBody);
        
        const response = await fetch('/api/stripe/complete-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        console.log('Complete-subscription response status:', response.status);
        console.log('Complete-subscription response ok:', response.ok);

        if (response.ok) {
          const subscriptionData = await response.json();
          console.log('✅ SUBSCRIPTION SUCCESS:', subscriptionData);
          
          // Trigger success event with website URL - but we need to get websiteUrl from props
          console.log('✅ CALLING onSuccess callback');
          onSuccess();
          console.log('✅ SUCCESS CALLBACK COMPLETED');
        } else {
          console.error('❌ SUBSCRIPTION API FAILED - Response status:', response.status);
          console.error('❌ SUBSCRIPTION API FAILED - Response ok:', response.ok);
          
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ SUBSCRIPTION ERROR DATA:', errorData);
          console.error('❌ SUBSCRIPTION ERROR STATUS TEXT:', response.statusText);
          
          onError(errorData.error || `Failed to complete subscription (${response.status}: ${response.statusText})`);
        }
      }
    } catch (err) {
      console.error('Subscription error:', err);
      onError('Subscription processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cardholder name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Full name on card"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card details
        </label>
        <div 
          id="subscription-card-element"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={processing}
        className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
{processing ? (
          <span className="flex items-center justify-center space-x-1">
            <span>Processing payment</span>
            <span className="flex space-x-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
          </span>
        ) : `Subscribe for $${finalAmount.toFixed(2)}/month`}
      </button>
    </form>
  );
}

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  websiteUrl: string;
  userEmail: string;
}

export default function SubscriptionPaymentModal({ 
  isOpen, 
  onClose, 
  websiteUrl, 
  userEmail 
}: SubscriptionPaymentModalProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [setupIntentId, setSetupIntentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [finalAmount, setFinalAmount] = useState(3.99);
  const isCreatingRef = useRef(false); // Prevent duplicate API calls

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setClientSecret('');
      setSetupIntentId('');
      setError('');
      setAppliedCoupon(null);
      setFinalAmount(3.99);
      isCreatingRef.current = false; // Reset the ref
    }
  }, [isOpen]);

  // Create subscription only when modal is open and no client secret exists
  useEffect(() => {
    if (isOpen && !clientSecret && !loading && !isCreatingRef.current) {
      console.log('SubscriptionPaymentModal: Creating subscription for', websiteUrl, userEmail);
      // Add a small debounce to prevent race conditions
      const timer = setTimeout(() => {
        if (!isCreatingRef.current && !clientSecret) {
          createSubscription();
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, clientSecret, loading]);

  // Recreate subscription when coupon changes (but not on initial load)
  useEffect(() => {
    if (isOpen && clientSecret && finalAmount !== 3.99 && !loading && !isCreatingRef.current) {
      console.log('SubscriptionPaymentModal: Recreating subscription due to coupon change');
      isCreatingRef.current = false; // Reset the ref
      setClientSecret(''); // This will trigger the above useEffect to create new subscription
    }
  }, [finalAmount]);

  // Apply coupon function
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const response = await fetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          amount: 3.99,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setFinalAmount(data.finalAmount);
        setShowCouponInput(false);
        setCouponCode('');
      } else {
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch (err) {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setFinalAmount(3.99);
    setClientSecret(''); // Force recreation of subscription
  };

  const createSubscription = async () => {
    if (loading || isCreatingRef.current) {
      console.log('⚠️ ALREADY CREATING SUBSCRIPTION - preventing duplicate call');
      return; // Prevent duplicate calls
    }
    
    // Create a unique key for this subscription request
    const cacheKey = `${websiteUrl}-${userEmail}-${finalAmount}`;
    
    // Check if we're already creating this exact subscription
    if (activeSubscriptionCreations.has(cacheKey)) {
      console.log('🔄 USING CACHED SUBSCRIPTION CREATION for', cacheKey);
      try {
        const data = await activeSubscriptionCreations.get(cacheKey)!;
        setClientSecret(data.client_secret);
        setSetupIntentId(data.setup_intent_id);
        return;
      } catch (err) {
        console.error('Cached subscription creation failed:', err);
        activeSubscriptionCreations.delete(cacheKey);
      }
    }
    
    try {
      isCreatingRef.current = true;
      setLoading(true);
      setError('');

      console.log('🚀 SubscriptionPaymentModal: Calling create-subscription API for', websiteUrl);

      // Create and cache the promise
      const subscriptionPromise = fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl,
          userEmail,
          couponId: appliedCoupon?.id || null,
          finalAmount,
        }),
      }).then(response => response.json());
      
      activeSubscriptionCreations.set(cacheKey, subscriptionPromise);

      const data = await subscriptionPromise;
      console.log('SubscriptionPaymentModal: API response:', data);
      
      if (data.client_secret && data.setup_intent_id) {
        console.log('✅ SETUP INTENT CREATED:', {
          client_secret: data.client_secret,
          setup_intent_id: data.setup_intent_id,
          customer_id: data.customer_id
        });
        setClientSecret(data.client_secret);
        setSetupIntentId(data.setup_intent_id);
      } else {
        console.error('❌ INVALID API RESPONSE:', data);
        setError(data.error || 'Failed to initialize subscription');
      }
    } catch (err) {
      console.error('SubscriptionPaymentModal: Error creating subscription:', err);
      setError('Failed to initialize subscription');
      activeSubscriptionCreations.delete(cacheKey);
    } finally {
      setLoading(false);
      isCreatingRef.current = false;
      // Remove from cache after a delay
      setTimeout(() => activeSubscriptionCreations.delete(cacheKey), 5000);
    }
  };

  const handlePaymentSuccess = () => {
    console.log('✅ PAYMENT SUCCESS - Closing payment modal and showing success modal');
    onClose();
    // Trigger success event with website URL - let success modal handle persistence
    window.dispatchEvent(new CustomEvent('subscriptionSuccess', { 
      detail: { websiteUrl } 
    }));
    // Remove automatic refresh - let user control when to refresh via success modal
    console.log('✅ Success modal will now be shown - user can close when ready');
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Handle 100% off coupons - bypass Stripe for $0 amounts
  const handleFreeSubscription = async () => {
    if (finalAmount === 0 && appliedCoupon) {
      setProcessing(true);
      try {
        const response = await fetch('/api/stripe/process-free-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            websiteUrl,
            userEmail,
            couponId: appliedCoupon.id,
          }),
        });

        if (response.ok) {
          handlePaymentSuccess();
        } else {
          throw new Error('Failed to process free subscription');
        }
      } catch (err) {
        setError('Failed to process free subscription');
      } finally {
        setProcessing(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Subscribe to reports</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Website URL Display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monitoring website
          </label>
          <div className="text-gray-900 font-medium truncate">
            {websiteUrl}
          </div>
        </div>

        {/* Amount Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Monthly subscription
          </label>
          <div className="text-center py-4">
            {appliedCoupon && (
              <div className="mb-3">
                <div className="text-lg text-gray-500 line-through">
                  $3.99
                </div>
                <div className="text-sm text-green-600 font-medium">
                  Coupon: {appliedCoupon.name} (-{appliedCoupon.percent_off ? `${appliedCoupon.percent_off}%` : `$${(appliedCoupon.amount_off / 100).toFixed(2)}`})
                </div>
              </div>
            )}
            <div className="text-4xl font-bold text-gray-900 mb-2">
              ${finalAmount.toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">
              per month • automatic bi-weekly reports
            </p>
            {appliedCoupon && (
              <button
                onClick={removeCoupon}
                className="text-xs text-red-600 hover:text-red-700 mt-1"
              >
                Remove coupon
              </button>
            )}
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="mb-6">
          {loading ? (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Setting up subscription...</span>
              </div>
            </div>
          ) : clientSecret && finalAmount > 0 ? (
            <SubscriptionStripeElementsForm
              clientSecret={clientSecret}
              finalAmount={finalAmount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              processing={processing}
              setProcessing={setProcessing}
              websiteUrl={websiteUrl}
            />
          ) : finalAmount === 0 && appliedCoupon ? (
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="text-center">
                <div className="text-green-700 font-medium mb-2">
                  🎉 100% Off Coupon Applied!
                </div>
                <p className="text-green-600 text-sm">
                  Click below to start your free subscription
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <p className="text-red-700 text-sm text-center">
                Setting up payment method...
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Coupon Section */}
        {!appliedCoupon && (
          <div className="mb-6">
            {!showCouponInput ? (
              <button
                onClick={() => setShowCouponInput(true)}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Have a coupon?
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={couponLoading}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {couponLoading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-600 text-sm">{couponError}</p>
                )}
                <button
                  onClick={() => {
                    setShowCouponInput(false);
                    setCouponCode('');
                    setCouponError('');
                  }}
                  className="text-gray-500 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={processing}
          >
            Cancel
          </button>
          {finalAmount === 0 && appliedCoupon ? (
            <button
              onClick={handleFreeSubscription}
              disabled={processing}
              className="flex-1 py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Start Free Subscription'
              )}
            </button>
          ) : null}
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You can cancel your subscription anytime. Reports will be sent to {userEmail}
        </p>
      </div>
    </div>
  );
}