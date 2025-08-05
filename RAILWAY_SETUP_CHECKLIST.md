# Railway Setup Checklist

## Pre-Deployment Setup

### 1. Railway Account Setup
- [ ] Sign up at https://railway.app with GitHub
- [ ] Subscribe to Hobby Plan ($5/month)
- [ ] Connect GitHub repository

### 2. Project Configuration
- [ ] Create new project from GitHub repo
- [ ] Verify Next.js detection and build settings
- [ ] Set custom domain (optional): www.shippingcomps.com

### 3. Environment Variables Transfer
Copy these from your current Vercel deployment:

```bash
# AI Services
OPENAI_API_KEY=sk-...
FIRECRAWL_API_KEY=fc-...

# Authentication  
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...

# Email & Payments
SENDGRID_API_KEY=SG...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
HUBSPOT_API_KEY=...

# Database
DATABASE_URL=postgresql://...

# Railway-specific
NEXTAUTH_URL=https://your-app.railway.app
```

### 4. DNS Configuration (if using custom domain)
- [ ] Update DNS records as shown in Railway dashboard
- [ ] Wait for SSL certificate provisioning (5-10 minutes)

## Post-Deployment Testing

### 5. Functionality Verification
- [ ] Homepage loads correctly
- [ ] User authentication works
- [ ] Analysis starts without JSON errors
- [ ] Full analysis completes within 10 minutes
- [ ] Results display properly
- [ ] Email delivery functions

### 6. Performance Validation
- [ ] Test with heirloomjerky.com (known working case)
- [ ] Verify 10-competitor analysis completes
- [ ] Check analysis quality and completeness
- [ ] Confirm no timeout errors

## Success Criteria
- ✅ Analysis completes in 6-10 minutes
- ✅ No timeout errors
- ✅ All competitors analyzed successfully  
- ✅ Professional reports generated
- ✅ Same quality as Replit development environment

## Rollback Plan
If issues occur:
- Keep Vercel deployment active during testing
- Test Railway thoroughly before switching DNS
- Can revert DNS changes if needed

Railway's 10-minute timeout should handle your analysis perfectly.