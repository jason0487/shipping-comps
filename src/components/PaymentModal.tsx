'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../context/AuthContext';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  tokens: number;
  packageType: string;
}

// Custom Stripe Elements Payment Form Component
function StripeElementsForm({ 
  clientSecret, 
  finalAmount, 
  onSuccess, 
  onError, 
  processing, 
  setProcessing 
}: { 
  clientSecret: string;
  finalAmount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
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
      const cardContainer = document.getElementById('card-element');
      if (cardContainer) {
        cardEl.mount('#card-element');
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

    console.log('PaymentModal v2.2 DEPLOYED - Stripe Elements payment:', new Date().toISOString());
    
    setProcessing(true);

    try {
      const { stripe, cardElement: cardEl } = stripeElements;
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardEl,
          billing_details: {
            name: cardholderName || 'Anonymous',
          },
        }
      });

      if (error) {
        console.error('Payment failed:', error);
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        
        // Trigger token refresh event instead of page reload
        window.dispatchEvent(new CustomEvent('tokensPurchased'));
        
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      onError('Payment processing failed. Please try again.');
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
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card details
        </label>
        <div 
          id="card-element"
          className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent min-h-[40px]"
        >
          {/* Stripe Elements will mount here */}
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripeElements || processing}
        className="w-full bg-gray-900 text-white py-3 px-4 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : `Pay $${finalAmount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function PaymentModal({ isOpen, onClose, amount, tokens, packageType }: PaymentModalProps) {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [finalAmount, setFinalAmount] = useState(amount);

  // Create payment intent when modal opens or amount changes
  useEffect(() => {
    if (isOpen && (!clientSecret || finalAmount !== amount)) {
      console.log('PaymentModal: Creating payment intent for', packageType, finalAmount);
      setClientSecret(''); // Reset to force new payment intent
      createPaymentIntent();
    }
  }, [isOpen, finalAmount]);

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
          amount,
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
    setFinalAmount(amount);
    setClientSecret(''); // Force recreation of payment intent
  };

  const createPaymentIntent = async () => {
    if (!user?.email) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount,
          packageType,
          couponId: appliedCoupon?.id || null,
          userEmail: user.email,
        }),
      });

      const data = await response.json();
      
      if (data.client_secret) {
        setClientSecret(data.client_secret);
      } else {
        console.error('Payment intent creation failed:', data);
        setError(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      onClose();
      setSuccess(false);
    }, 2000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Handle 100% off coupons - bypass Stripe for $0 amounts
  const handleFreeCoupon = async () => {
    if (finalAmount === 0 && appliedCoupon) {
      setProcessing(true);
      try {
        const response = await fetch('/api/stripe/process-free-coupon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            packageType,
            tokens,
            couponId: appliedCoupon.id,
            userEmail: user.email,
          }),
        });

        if (response.ok) {
          window.dispatchEvent(new CustomEvent('tokensPurchased'));
          handlePaymentSuccess();
        } else {
          throw new Error('Failed to process free coupon');
        }
      } catch (err) {
        setError('Failed to process free coupon');
      } finally {
        setProcessing(false);
      }
    }
  };

  if (!isOpen) return null;

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center py-8">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-gray-600">Your tokens have been added to your account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add tokens</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Amount Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Amount being charged
          </label>
          <div className="text-center py-4">
            {appliedCoupon && (
              <div className="mb-3">
                <div className="text-lg text-gray-500 line-through">
                  ${amount.toFixed(2)}
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
              {tokens} tokens • 1 token = 1 report
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
                <span className="text-gray-600">Loading payment options...</span>
              </div>
            </div>
          ) : clientSecret && finalAmount > 0 ? (
            <StripeElementsForm
              clientSecret={clientSecret}
              finalAmount={finalAmount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              processing={processing}
              setProcessing={setProcessing}
            />
          ) : finalAmount === 0 && appliedCoupon ? (
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="text-center">
                <div className="text-green-700 font-medium mb-2">
                  🎉 100% Off Coupon Applied!
                </div>
                <p className="text-green-600 text-sm">
                  Click below to claim your free tokens
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <p className="text-red-700 text-sm text-center">
                Please use Stripe Elements to collect card details: https://stripe.com/docs/stripe-js#elements.
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
              onClick={handleFreeCoupon}
              disabled={processing}
              className="flex-1 py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Claim Free Tokens'
              )}
            </button>
          ) : null}
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Your payment is secured by Stripe. Tokens will be added to your account immediately.
        </p>
      </div>
    </div>
  );
}