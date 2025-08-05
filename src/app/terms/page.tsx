export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-[100px]">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using Shipping Comps (the "Service"), operated by Deliveri Labs ("we," "us," or "our"), 
              you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, 
              please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              Shipping Comps is an AI-powered platform that provides competitive shipping analysis for e-commerce businesses. 
              Our Service analyzes publicly available shipping information from competitor websites and provides insights, 
              recommendations, and reports to help optimize your shipping strategies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Subscription</h2>
            <p className="text-gray-700 mb-4">
              To access certain features of our Service, you may be required to create an account. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Promptly updating your account information</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Subscription services are billed in advance on a recurring basis. You may cancel your subscription at any time 
              through your account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Token System and Payment</h2>
            <p className="text-gray-700 mb-4">
              Our Service operates on a token-based system where each analysis consumes tokens. Payment for tokens and 
              subscriptions is processed through Stripe. All fees are non-refundable except as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Use the Service for any unlawful purposes</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use automated scripts to access the Service beyond normal usage</li>
              <li>Resell or redistribute our analysis reports without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Service, including all content, features, and functionality, is owned by Deliveri Labs and is protected 
              by copyright, trademark, and other intellectual property laws. Analysis reports generated for you are licensed 
              for your business use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data and Privacy</h2>
            <p className="text-gray-700 mb-4">
              We collect and process data as described in our Privacy Policy. By using our Service, you consent to 
              such processing and warrant that all data provided by you is accurate.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimers and Limitations</h2>
            <p className="text-gray-700 mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THE ACCURACY, 
              COMPLETENESS, OR RELIABILITY OF ANALYSIS RESULTS. OUR LIABILITY IS LIMITED TO THE AMOUNT PAID FOR THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account at any time for violation of these Terms. You may terminate 
              your account by canceling your subscription and ceasing use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. 
              Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-700">
              Email: help@ondeliveri.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}