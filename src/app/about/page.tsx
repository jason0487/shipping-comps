'use client';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1152px] mx-auto px-4 sm:px-6 lg:px-8 mt-[100px]">
        
        {/* Hero Section */}
        <section className="pt-16 pb-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="mb-6">
                <span className="text-sm font-medium text-orange-600 tracking-wide uppercase">About Deliveri Labs</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
                Empowering the underdog eCommerce brand
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Founded by e-commerce experts, we create cutting-edge shipping solutions tailored for businesses of all sizes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 text-center"
                >
                  Get Started
                </a>
                <a
                  href="/how-it-works"
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-4 rounded-lg font-semibold transition-all text-center"
                >
                  Learn More
                </a>
              </div>
            </div>
            
            {/* Right Image */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <img
                  src="/images/about-hero.jpg"
                  alt="Team member working on eCommerce analytics"
                  className="w-full h-[400px] object-cover"
                  onError={(e) => {
                    // Fallback to a solid color background if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.style.background = 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
                    e.currentTarget.parentElement.style.minHeight = '400px';
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission Statement Section */}
        <section className="py-16 bg-white rounded-3xl mb-16">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="flex text-orange-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                ))}
              </div>
              <span className="ml-3 text-sm text-gray-600">1,000+ reviews</span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8 leading-tight">
              We are passionate about empowering <span className="text-gray-400">individuals and businesses</span> to take control of their competitive landscape and achieve their growth goals.
            </h2>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">95%</div>
              <p className="text-gray-600 text-sm">Customer satisfaction rate, reflecting our dedication.</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">500+</div>
              <p className="text-gray-600 text-sm">Brands analyzed to solve competitive challenges.</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">10K+</div>
              <p className="text-gray-600 text-sm">Shipping policies analyzed across competitor websites.</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">24/7</div>
              <p className="text-gray-600 text-sm">Real-time monitoring, providing them with actionable insights.</p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-white rounded-3xl mb-16">
          <div className="max-w-4xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Empowering and strengthening your competitive success
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  We created Deliveri Labs for you—the bold, the small, the struggling, the courageous. The brands that don't have a war chest of capital, but do have grit, heart, and purpose. The ones trying to not just survive—but to do good. To push boundaries. To make change.
                </p>
                
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Deliveri Labs is where innovation meets empathy. It's not just a playground for ideas. It's a proving ground for solutions designed to uplift the people and brands who often get overlooked.
                </p>

                <div className="bg-orange-50 rounded-2xl p-6">
                  <p className="text-orange-800 font-semibold mb-2">Because we believe transparency is power.</p>
                  <p className="text-orange-700">And when you're armed with the right data, the playing field starts to level.</p>
                </div>
              </div>

              {/* Right Visualization */}
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-semibold text-gray-900">Competitive Intelligence</h4>
                </div>
                
                {/* Progress Circle */}
                <div className="text-center mb-8">
                  <div className="relative inline-flex items-center justify-center w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        stroke="#f3f4f6"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        stroke="#f97316"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${80 * 3.01593} ${301.593}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">80%</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">Average improvement in competitive positioning</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Our Philosophy</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              At its core, Deliveri Labs is an act of trust. A signal to the community that we're listening, learning, and building—with you and for you.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <img 
                  src="/images/trust-icon.png" 
                  alt="Trust icon" 
                  className="w-16 h-16 rounded-2xl"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Trust</h3>
              <p className="text-gray-600 leading-relaxed">
                At its core, Deliveri Labs is an act of trust. A signal to the community that we're listening, learning, and building—with you and for you.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <img 
                  src="/images/purpose-icon.png" 
                  alt="Purpose icon" 
                  className="w-16 h-16 rounded-2xl"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Purpose</h3>
              <p className="text-gray-600 leading-relaxed">
                This isn't just software. It's a shared belief in the idea that better tools can create a better future—for your brand, for your customers, for all of us.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <img 
                  src="/images/collaboration-icon.png" 
                  alt="Collaboration icon" 
                  className="w-16 h-16 rounded-2xl"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Collaboration</h3>
              <p className="text-gray-600 leading-relaxed">
                Welcome to Deliveri Labs. Let's build the next chapter of eCommerce—together.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-12 lg:p-16 text-white text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Ready to Level the Playing Field?
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                Join the movement of eCommerce brands using intelligent data to compete smarter and build better customer experiences.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="/"
                  className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                >
                  Start Your Analysis
                </a>
                <a
                  href="/how-it-works"
                  className="text-white hover:text-gray-200 px-8 py-4 rounded-xl font-semibold border border-white/30 hover:border-white/50 transition-all backdrop-blur-sm"
                >
                  Learn How It Works
                </a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}