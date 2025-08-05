'use client';

import { useState } from 'react';

interface Subscription {
  id: string;
  website_url: string;
  subscription_type: string;
  is_active: boolean;
  price_monthly: number;
  stripe_subscription_id: string;
  next_report_date: string;
  created_at: string;
  updated_at: string;
}

interface CancelSubscriptionModalProps {
  subscription: Subscription;
  isOpen: boolean;
  onClose: () => void;
  onCancel: (subscriptionId: string) => void;
}

export default function CancelSubscriptionModal({ 
  subscription, 
  isOpen, 
  onClose, 
  onCancel 
}: CancelSubscriptionModalProps) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelOption, setCancelOption] = useState('end_of_period');

  if (!isOpen) return null;

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await onCancel(subscription.id);
      onClose();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setCancelling(false);
    }
  };

  const nextBillingDate = new Date(subscription.next_report_date);
  const isNextBillingClose = (nextBillingDate.getTime() - Date.now()) < (7 * 24 * 60 * 60 * 1000); // Less than 7 days

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Cancel Subscription</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Subscription Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Subscription Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Website:</span> {subscription.website_url}</p>
              <p><span className="font-medium">Type:</span> {subscription.subscription_type.replace('_', ' ')}</p>
              <p><span className="font-medium">Price:</span> <span className="text-orange-500">${subscription.price_monthly}/month</span></p>
              <p><span className="font-medium">Next billing:</span> {nextBillingDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}</p>
            </div>
          </div>

          {/* Cancellation Options */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">When would you like to cancel?</h3>
            
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="cancelOption"
                  value="end_of_period"
                  checked={cancelOption === 'end_of_period'}
                  onChange={(e) => setCancelOption(e.target.value)}
                  className="mt-1 h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    At the end of current billing period
                  </div>
                  <div className="text-xs text-gray-500">
                    Continue receiving reports until {nextBillingDate.toLocaleDateString()} (Recommended)
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="cancelOption"
                  value="immediately"
                  checked={cancelOption === 'immediately'}
                  onChange={(e) => setCancelOption(e.target.value)}
                  className="mt-1 h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Cancel immediately
                  </div>
                  <div className="text-xs text-gray-500">
                    Stop all reports and billing right now
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Important - No Refunds</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    No refunds will be given for the current billing period if it has already been paid. 
                    {cancelOption === 'end_of_period' ? (
                      ` You will continue to receive reports until ${nextBillingDate.toLocaleDateString()}.`
                    ) : (
                      ` If you cancel immediately, you will lose access to any remaining paid time.`
                    )}
                  </p>
                  {isNextBillingClose && (
                    <p className="mt-2 font-medium">
                      Your next billing date is in less than 7 days. Consider waiting until the end of the billing period to get full value.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Keep Subscription
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}