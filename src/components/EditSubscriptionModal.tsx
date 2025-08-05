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

interface EditSubscriptionModalProps {
  subscription: Subscription;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSubscription: Partial<Subscription>) => void;
}

export default function EditSubscriptionModal({ 
  subscription, 
  isOpen, 
  onClose, 
  onSave 
}: EditSubscriptionModalProps) {
  const [websiteUrl, setWebsiteUrl] = useState(subscription.website_url);
  const [reportEmail, setReportEmail] = useState('');
  const [reportFrequency, setReportFrequency] = useState('biweekly');
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    setErrors({});
    
    // Validation
    const newErrors: { [key: string]: string } = {};
    
    if (!websiteUrl.trim()) {
      newErrors.websiteUrl = 'Website URL is required';
    } else if (!validateUrl(websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
    }
    
    if (reportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reportEmail)) {
      newErrors.reportEmail = 'Please enter a valid email address';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSaving(true);
    
    try {
      // Here you would make API call to update subscription
      const updatedData: Partial<Subscription> = {
        website_url: websiteUrl,
        // Add other fields as needed
      };
      
      await onSave(updatedData);
      onClose();
    } catch (error) {
      setErrors({ general: 'Failed to update subscription. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Subscription</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Website URL */}
            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Website URL *
              </label>
              <input
                type="url"
                id="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                  errors.websiteUrl ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="https://example.com"
              />
              {errors.websiteUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.websiteUrl}</p>
              )}
            </div>

            {/* Report Email */}
            <div>
              <label htmlFor="reportEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Report Email Address
              </label>
              <input
                type="email"
                id="reportEmail"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                  errors.reportEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="your@email.com"
              />
              {errors.reportEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.reportEmail}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to use your account email
              </p>
            </div>

            {/* Report Frequency */}
            <div>
              <label htmlFor="reportFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                Report Frequency
              </label>
              <select
                id="reportFrequency"
                value={reportFrequency}
                onChange={(e) => setReportFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="biweekly">Every 2 weeks</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Current Subscription Info */}
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Subscription</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><span className="font-medium">Type:</span> {subscription.subscription_type.replace('_', ' ')}</p>
                <p><span className="font-medium">Price:</span> <span className="text-orange-500">${subscription.price_monthly}/month</span></p>
                <p><span className="font-medium">Next Report:</span> {new Date(subscription.next_report_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}