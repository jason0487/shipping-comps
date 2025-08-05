'use client';

import { useRouter } from 'next/navigation';

interface SubscriptionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  websiteUrl: string;
}

export default function SubscriptionSuccessModal({ 
  isOpen, 
  onClose, 
  websiteUrl 
}: SubscriptionSuccessModalProps) {
  const router = useRouter();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center py-8">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Subscription Activated!</h3>
          <div className="space-y-3 text-gray-600">
            <p>Your bi-weekly shipping analysis report for:</p>
            <div className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg break-all">
              {websiteUrl}
            </div>
            <p>are now active.</p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm">
              <p className="font-medium text-blue-900">What happens next:</p>
              <ul className="mt-2 space-y-1 text-blue-800">
                <li>• Welcome report arrives shortly</li>
                <li>• Next report arrives in 2 weeks</li>
                <li>• Automatic competitor monitoring</li>
                <li>• Email notifications for changes</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => {
                // Close modal first, then navigate with Next.js router
                onClose();
                // Use Next.js router.push for proper client-side navigation
                router.push('/profile');
              }}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-black transition-colors"
            >
              View My Subscriptions
            </button>
            <button
              onClick={() => {
                // Just close modal and stay on current page to avoid session issues
                onClose();
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}