'use client';

import Image from 'next/image';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-[100px]">
        {/* Hero Section */}
        <div className="text-center mb-24">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight" style={{ color: '#1A1A1A' }}>
            How Shipping Comps Works
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Get comprehensive shipping intelligence through three powerful reports that help you optimize your logistics strategy and boost conversions.
          </p>
        </div>

        {/* Competitor Analysis Report */}
        <section className="mb-32">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-12 lg:p-16">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7">
                <div className="mb-6">
                  <span className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 text-sm font-medium rounded-full mb-6">
                    Report #1
                  </span>
                  <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight" style={{ color: '#1A1A1A' }}>
                    Competitor Analysis Report
                  </h2>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Discover exactly how your competitors structure their shipping strategies with real-time analysis of their policies, thresholds, and incentives.
                  </p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Live Competitor Data</h4>
                    <p className="text-gray-600 text-sm">Real-time scraping of competitor websites to capture current shipping policies</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Visual Threshold Mapping</h4>
                    <p className="text-gray-600 text-sm">Interactive bars showing competitor positioning on $0-$200+ spectrum</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Business Intelligence</h4>
                    <p className="text-gray-600 text-sm">Detailed analysis of competitor business models and strategic positioning</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Strategy Breakdown</h4>
                    <p className="text-gray-600 text-sm">Comprehensive overview of delivery options and promotional offers</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                  <h4 className="font-bold text-gray-900 mb-3">Key Benefits</h4>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Identify optimal free shipping thresholds</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Spot market gaps and opportunities</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Benchmark against industry leaders</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Make data-driven shipping decisions</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-5">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-orange-200 to-amber-200 rounded-2xl opacity-50 blur-lg"></div>
                  <img
                    src="/images/competitor-analysis-sample.svg"
                    alt="Competitor Analysis Report Screenshot"
                    className="relative w-full h-auto shadow-2xl rounded-xl border border-white/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Plan Email */}
        <section className="mb-32">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-12 lg:p-16">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7">
                <div className="mb-6">
                  <span className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 text-sm font-medium rounded-full mb-6">
                    Report #2
                  </span>
                  <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight" style={{ color: '#1A1A1A' }}>
                    Personalized Action Plan
                  </h2>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Receive a detailed, step-by-step shipping strategy tailored specifically to your business with competitive grading and implementation timeline.
                  </p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Competitive Grade (A+ to F)</h4>
                    <p className="text-gray-600 text-sm">See exactly how your shipping strategy ranks with visual gauge scoring</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Color-Coded Timeline</h4>
                    <p className="text-gray-600 text-sm">Immediate actions, strategic moves, and advanced optimization phases</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Specific Recommendations</h4>
                    <p className="text-gray-600 text-sm">Precise threshold adjustments and promotional strategies</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">ROI Projections</h4>
                    <p className="text-gray-600 text-sm">Expected conversion improvements and revenue impact</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                  <h4 className="font-bold text-gray-900 mb-3">Implementation Benefits</h4>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Increase average order value by 15-30%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Reduce cart abandonment rates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Improve customer satisfaction scores</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Optimize shipping cost margins</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-5">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-orange-200 to-amber-200 rounded-2xl opacity-50 blur-lg"></div>
                  <img
                    src="/images/recommendation-email-sample.svg"
                    alt="Personalized Action Plan Email Screenshot"
                    className="relative w-full h-auto shadow-2xl rounded-xl border border-white/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bi-weekly Intelligence Report */}
        <section className="mb-32">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-12 lg:p-16">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7">
                <div className="mb-6">
                  <span className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 text-sm font-medium rounded-full mb-6">
                    Report #3
                  </span>
                  <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight" style={{ color: '#1A1A1A' }}>
                    Bi-weekly Intelligence Report
                  </h2>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Stay ahead of market changes with automated competitor monitoring that tracks shipping policy updates and identifies new opportunities.
                  </p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Change Detection</h4>
                    <p className="text-gray-600 text-sm">Automatic tracking with color-coded alerts for threshold changes</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Market Trend Analysis</h4>
                    <p className="text-gray-600 text-sm">Historical comparison showing directional market trends</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Competitive Positioning</h4>
                    <p className="text-gray-600 text-sm">Updated gauge showing your market position relative to changes</p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Actionable Insights</h4>
                    <p className="text-gray-600 text-sm">Strategic recommendations based on market movements</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                  <h4 className="font-bold text-gray-900 mb-3">Ongoing Value</h4>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      <span>Never miss competitor strategy changes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      <span>React quickly to market opportunities</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      <span>Maintain competitive advantages</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      <span>Continuous optimization guidance</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-5">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-orange-200 to-amber-200 rounded-2xl opacity-50 blur-lg"></div>
                  <img
                    src="/images/biweekly-report-sample.svg"
                    alt="Bi-weekly Intelligence Report Screenshot"
                    className="relative w-full h-auto shadow-2xl rounded-xl border border-white/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-12 lg:p-16 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Ready to Optimize Your Shipping Strategy?
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                Join hundreds of e-commerce businesses using Shipping Comps to make smarter logistics decisions and increase conversions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <a
                  href="/"
                  className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                >
                  Start Free Analysis
                </a>
                <a
                  href="/pricing"
                  className="text-white hover:text-gray-200 px-8 py-4 rounded-xl font-semibold border border-white/30 hover:border-white/50 transition-all backdrop-blur-sm"
                >
                  View Pricing
                </a>
              </div>
              
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Get results in under 60 seconds</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Real-time competitor data</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}