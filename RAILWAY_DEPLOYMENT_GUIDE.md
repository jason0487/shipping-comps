# Railway Deployment Guide - Shipping Comps

## Overview
Deploy your Next.js app to Railway Hobby plan ($5/month) to get 10-minute timeout limits for your competitive analysis.

## Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (recommended for easy deployment)
3. Choose **Hobby Plan** ($5/month)

## Step 2: Deploy from GitHub
1. Click "New Project" in Railway dashboard
2. Select "Deploy from GitHub repo"
3. Choose your shipping-comps repository
4. Railway will automatically detect Next.js and configure build settings

## Step 3: Environment Variables
Add these environment variables in Railway project settings:

```
OPENAI_API_KEY=your_openai_key
FIRECRAWL_API_KEY=your_firecrawl_key  
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SENDGRID_API_KEY=your_sendgrid_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
HUBSPOT_API_KEY=your_hubspot_key
DATABASE_URL=your_supabase_database_url
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=your_nextauth_secret
```

## Step 4: Custom Domain (Optional)
1. In Railway dashboard, go to Settings > Domains
2. Add your custom domain: www.shippingcomps.com
3. Update DNS records as instructed

## Step 5: Database Connection
Your existing Supabase database will work without changes. Just ensure DATABASE_URL is correct.

## Benefits of Railway vs Vercel
- **10-minute timeout** (vs 10 seconds on Vercel free)
- **$5/month** (vs $20 for Vercel Pro)
- **Better for long-running processes**
- **Same Next.js code** works without modification

## Expected Results
- Full 10-competitor analysis completes successfully
- 6-10 minute processing time within timeout limits
- All existing features work identically
- Professional analysis reports delivered

## Deployment Timeline
- Setup: 10-15 minutes
- First deployment: 5-10 minutes
- Testing: Immediate

Railway is specifically designed for applications like yours that need longer processing times.