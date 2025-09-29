# Shipping Comps - AI-Powered Competitor Analysis Platform

An advanced eCommerce shipping optimization platform that provides intelligent, real-time competitor analysis and actionable logistics insights. Built by Deliveri Labs to empower underdog eCommerce brands with enterprise-level competitive intelligence.

## 🚀 Features

### Competitor Analysis Reports
- **Real-time Data**: Live competitor shipping policy analysis using Perplexity AI
- **Visual Metrics**: Interactive shipping threshold visualization with color-coded ranges
- **Business Intelligence**: Comprehensive competitor business analysis with industry context
- **Brand Logos**: Automatic competitor logo fetching for professional presentation

### Personalized Action Plans  
- **Competitive Grading**: A+ to F scoring system based on shipping competitiveness
- **Implementation Timeline**: Immediate, 30-day, and 60-90 day action items
- **Custom Recommendations**: Tailored shipping strategy based on your market position
- **Email Delivery**: Professional HTML reports sent directly to your inbox

### Bi-weekly Intelligence Reports
- **Change Detection**: Automated monitoring of competitor shipping policy changes
- **Market Trends**: Industry-wide shipping threshold analysis and insights
- **Historical Tracking**: Compare current vs. previous competitor strategies
- **Subscription Service**: $3.99/month automated reporting for ongoing intelligence

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Node.js API routes, Flask integration
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with Google OAuth
- **Payments**: Stripe subscriptions and one-time purchases
- **AI/ML**: OpenAI GPT-4o, Perplexity AI for web scraping
- **Email**: SendGrid for transactional emails
- **Deployment**: Railway with custom domain
- **CRM Integration**: HubSpot for lead management

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Required API keys (see Environment Variables)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/shipping-comps.git
cd shipping-comps
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email
SENDGRID_API_KEY=your_sendgrid_api_key

# CRM
HUBSPOT_API_KEY=your_hubspot_api_key
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
shipping-comps/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── about/             # About page
│   │   ├── how-it-works/      # Features page
│   │   ├── pricing/           # Pricing page
│   │   ├── profile/           # User dashboard
│   │   └── sign-in/           # Authentication
│   ├── components/            # React components
│   │   ├── analysis/          # Analysis results components
│   │   ├── auth/              # Authentication components
│   │   └── ui/                # Shared UI components
│   ├── context/               # React context providers
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── prisma/                    # Database schema
└── docs/                      # Documentation
```

## 🚀 Deployment

### Railway (Current Production)

1. **Deploy to Railway**
```bash
# Connect your GitHub repository to Railway
# Railway will automatically deploy on push to main branch
```

2. **Configure environment variables** in Railway dashboard

3. **Custom domain configured**: [www.shippingcomps.com](https://www.shippingcomps.com)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- **Email**: support@shippingcomps.com
- **Issues**: GitHub Issues

## 🙏 Acknowledgments

Built with ❤️ by [Deliveri Labs](https://deliveri.com) - Empowering the underdog eCommerce brand.

---

**Live Demo**: [shippingcomps.com](https://shippingcomps.com)
