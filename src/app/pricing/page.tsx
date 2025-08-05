'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import SignInModal from '@/components/auth/SignInModal';
import PaymentModal from '@/components/PaymentModal';
import SubscriptionModal from '@/components/SubscriptionModal';
import SubscriptionPaymentModal from '@/components/SubscriptionPaymentModal';
import SubscriptionSuccessModal from '@/components/SubscriptionSuccessModal';

export default function Pricing() {
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSubscriptionPaymentModal, setShowSubscriptionPaymentModal] = useState(false);
  const [showSubscriptionSuccessModal, setShowSubscriptionSuccessModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{amount: number, tokens: number, type: string} | null>(null);
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { user, signIn, signUp, signOut, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check for canceled payment in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('canceled') === 'true') {
        setMessage('Payment was canceled. You can try again anytime.');
      }
    }

    // Listen for subscription success events
    const handleSubscriptionSuccess = (event: CustomEvent) => {
      console.log('🎉 SUBSCRIPTION SUCCESS EVENT RECEIVED:', event.detail);
      console.log('🎉 SHOWING SUCCESS MODAL');
      // Update the subscriptionUrl with the website from the event
      if (event.detail && event.detail.websiteUrl) {
        setSubscriptionUrl(event.detail.websiteUrl);
      }
      setShowSubscriptionSuccessModal(true);
    };

    window.addEventListener('subscriptionSuccess', handleSubscriptionSuccess as EventListener);

    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionSuccess as EventListener);
    };
  }, []);

  const handlePurchase = (packageType: string) => {
    console.log('Purchase attempt - User:', user, 'isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated || !user) {
      console.log('Not authenticated, showing sign-in modal');
      setShowSignInModal(true);
      return;
    }

    // Set package details based on package type
    if (packageType === 'tokens_10') {
      setSelectedPackage({ amount: 9.99, tokens: 10, type: 'tokens_10' });
    } else if (packageType === 'tokens_30') {
      setSelectedPackage({ amount: 19.99, tokens: 30, type: 'tokens_30' });
    }
    setShowPaymentModal(true);
  };

  const handleSubscribe = () => {
    if (!isAuthenticated || !user) {
      setShowSignInModal(true);
      return;
    }

    // Close any open payment modals first
    setShowPaymentModal(false);
    setSelectedPackage(null);
    setShowSubscriptionModal(true);
  };

  const handleSubscriptionSubmit = async (url: string) => {
    setSubscriptionUrl(url);
    setShowSubscriptionModal(false);
    setShowSubscriptionPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-[100px]">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-900">
            Get the competitor intelligence you need to optimize your shipping strategy
          </p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-center">{message}</p>
              <button 
                onClick={() => setMessage(null)}
                className="mt-2 text-yellow-600 hover:text-yellow-800 text-sm mx-auto block"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Bi-Weekly Reports - 50/50 Split Layout */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-white rounded-lg p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left Side - Content (50%) */}
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Bi-Weekly Reports</h2>
                  <p className="text-gray-900">Ongoing competitor monitoring</p>
                </div>
                
                <div className="text-center mb-8">
                  <div className="text-4xl font-bold text-orange-500 mb-2">$3.99</div>
                  <div className="text-gray-900">per website per month</div>
                </div>

                <div className="mb-8 flex justify-center">
                  <div className="w-80 space-y-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Automated competitor tracking</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Shipping policy change alerts</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Market trend analysis</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Email reports every 2 weeks</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={handleSubscribe}
                    className="bg-gray-900 text-white py-3 px-8 rounded-lg hover:bg-black transition-all duration-200 font-semibold"
                  >
                    Subscribe Now
                  </button>
                </div>
              </div>

              {/* Right Side - Email Preview Image (50%) */}
              <div>
                <div className="bg-gray-100 rounded-lg pt-6 border-2 border-gray-200 relative h-96 overflow-hidden flex items-end">
                  <div className="w-full">
                    {/* Bi-Weekly Report Image - Reduced size with top padding only */}
                    <img
                      src="/BiWeeklyReport2.png"
                      alt="Bi-Weekly Report Email Preview"
                      className="w-full h-auto object-contain"
                      style={{ 
                        objectPosition: 'bottom',
                        transform: 'scale(0.85)',
                        transformOrigin: 'bottom center'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Tokens Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis Tokens</h2>
            <p className="text-xl text-gray-600">Pay-per-use competitor analysis</p>
          </div>

          {/* Shared Features */}
          <div className="mb-8 flex justify-center">
            <div className="w-80 space-y-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Real-time competitor data</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Shipping strategy insights</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">PDF reports included</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* 10 Token Package */}
            <div className="bg-white rounded-lg p-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">$9.99</div>
                <div className="text-gray-600 mb-2">10 Tokens</div>
                <div className="text-sm text-gray-500 mb-6">1 token = 1 competitor analysis</div>

                <button
                  className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg hover:bg-black transition-all duration-200 font-semibold text-lg"
                  onClick={() => handlePurchase('tokens_10')}
                >
                  Purchase 10 Tokens
                </button>
              </div>
            </div>

            {/* 30 Token Package */}
            <div className="bg-white rounded-lg p-8 relative">
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save $10!
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold text-orange-500">$19.99</span>
                  <span className="text-lg text-gray-400 line-through ml-2">$29.99</span>
                </div>
                <div className="text-gray-600 mb-2">30 Tokens</div>
                <div className="text-sm text-gray-500 mb-6">1 token = 1 competitor analysis</div>

                <button
                  className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg hover:bg-black transition-all duration-200 font-semibold text-lg"
                  onClick={() => handlePurchase('tokens_30')}
                >
                  Purchase 30 Tokens
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-900 mb-4">
            Need a custom solution for your enterprise?
          </p>
          <a 
            href="mailto:sales@ondeliveri.com"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Contact our sales team
          </a>
        </div>
      </main>
      
      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />

      {/* Payment Modal - Only show when not showing subscription modal */}
      {selectedPackage && !showSubscriptionModal && !showSubscriptionPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPackage(null);
          }}
          amount={selectedPackage.amount}
          tokens={selectedPackage.tokens}
          packageType={selectedPackage.type}
        />
      )}

      {/* Subscription URL Input Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscribe={handleSubscriptionSubmit}
      />

      {/* Subscription Payment Modal */}
      {subscriptionUrl && user && (
        <SubscriptionPaymentModal
          isOpen={showSubscriptionPaymentModal}
          onClose={() => {
            setShowSubscriptionPaymentModal(false);
            setSubscriptionUrl('');
          }}
          websiteUrl={subscriptionUrl}
          userEmail={user.email}
        />
      )}

      {/* Subscription Success Modal */}
      <SubscriptionSuccessModal
        isOpen={showSubscriptionSuccessModal}
        onClose={() => setShowSubscriptionSuccessModal(false)}
        websiteUrl={subscriptionUrl}
      />
    </div>
  );
}