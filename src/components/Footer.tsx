'use client';

import Link from 'next/link';

export default function Footer() {
  const handleReportIssue = () => {
    const email = 'help@ondeliveri.com';
    const subject = 'Shipping Comps Issue:';
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    window.location.href = mailtoLink;
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20">
      <div className="max-w-[1152px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1">
            <div className="flex items-center mb-4">
              <img
                className="h-8 w-auto"
                src="/images/deliveri-labs-logo.png"
                alt="Deliveri Labs"
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              AI-powered competitor shipping analysis for e-commerce brands.
            </p>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Deliveri Labs. All rights reserved.
            </p>
          </div>

          {/* Product */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/how-it-works" className="text-sm text-gray-600 hover:text-gray-900">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Account</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/sign-in?signup=true" className="text-sm text-gray-600 hover:text-gray-900">
                  Sign Up
                </Link>
              </li>
              <li>
                <button
                  onClick={handleReportIssue}
                  className="text-sm text-gray-600 hover:text-gray-900 text-left"
                >
                  Report an Issue
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}