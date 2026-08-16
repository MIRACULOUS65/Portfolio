# 🚀 Deployment Guide

This portfolio is ready for deployment to Vercel. Follow these steps:

## 🎯 Quick Start (TL;DR)

**Deploy in 3 steps:**
1. Push code to GitHub: `git push origin main`
2. Go to [vercel.com/new](https://vercel.com/new) and import your repo
3. Click "Deploy" - Done! 🎉

**That's it!** Vercel auto-detects Next.js and handles everything.

---

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works)
- Git repository with your code pushed to GitHub/GitLab/Bitbucket

## ✅ Pre-Deployment Verification

Before deploying, ensure:

```bash
# Test build locally
npm run build

# Test production server locally (after build)
npm run start
```

Both commands should complete successfully with no errors.

**Expected output:**
- ✓ Compiled successfully
- ✓ All 13 routes generated
- ✓ Data validation passing

---

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables:**
   - In Vercel dashboard, go to your project settings
   - Navigate to "Environment Variables"
   - Add any required variables (if you have them in `.env.local`)

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - You'll get a URL like: `your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - For production deployment:
   ```bash
   vercel --prod
   ```

## Custom Domain Setup

1. Go to your project in Vercel dashboard
2. Navigate to "Settings" → "Domains"
3. Add your custom domain (e.g., `sushovan-ghosh.is-a.dev`)
4. Follow Vercel's instructions to update DNS records

## Build Configuration

The project includes:
- ✅ `vercel.json` - Vercel configuration
- ✅ `.vercelignore` - Files to exclude from deployment
- ✅ Optimized build process with Next.js 16

### Build Process

Vercel will automatically:
1. Install dependencies (`npm install`)
2. Run data validation (`npm run validate-data`)
3. Build the project (`npm run build`)
4. Deploy to edge network

**Build time:** ~30-60 seconds  
**Output:** Static pages + serverless functions

---

## Environment Variables

This portfolio doesn't require any mandatory environment variables to function. However, if you want to customize or add features:

### Optional Environment Variables:

```bash
# If you want to add analytics (optional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# If you add any API integrations (optional)
# Example: NEXT_PUBLIC_API_URL=https://api.example.com
```

### How to Add in Vercel:

1. Go to your project in Vercel dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add variables for all environments (Production, Preview, Development)
4. Redeploy to apply changes

**Note:** The competitive programming API routes (`/api/codechef`, `/api/codeforces`, `/api/leetcode`, `/api/hashnode`) are serverless functions that work without environment variables. They fetch data from public APIs.

## Post-Deployment Checklist

- [ ] Visit your deployed URL
- [ ] Test all pages: Home, Projects, Blog, Hackathons, Certifications
- [ ] Check mobile responsiveness
- [ ] Verify all images load correctly
- [ ] Test navigation and links
- [ ] Check social links work
- [ ] Verify smooth scrolling works
- [ ] Test dark mode (default theme)

## Automatic Deployments

Once connected to GitHub, Vercel will automatically:
- Deploy every push to `main` branch to production
- Create preview deployments for pull requests

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Run `npm run build` locally first

### Images Not Loading
- Check image paths are correct in `/public/images/`
- Verify Next.js Image optimization is working

### Environment Variables
- Ensure all required env vars are set in Vercel dashboard
- Prefix client-side variables with `NEXT_PUBLIC_`

## Performance Optimization

The portfolio is already optimized with:
- ✅ Static page generation
- ✅ Image optimization via Next.js Image
- ✅ Tailwind CSS for minimal CSS
- ✅ Code splitting
- ✅ Lazy loading

## Support

For issues with:
- **Vercel deployment**: [Vercel Documentation](https://vercel.com/docs)
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)

---

**Note**: This project has been cleaned for deployment:
- All test files removed
- Documentation moved
- Unused images deleted
- Development dependencies optimized
