# ✅ Pre-Deployment Checklist

## Project Cleanup - COMPLETED ✅

- [x] Removed all test files (258 files)
- [x] Removed test configuration files (vitest.config.ts, vitest.setup.ts)
- [x] Removed documentation folder (Docs/)
- [x] Removed unused UI folder
- [x] Removed unused images (hackathon pics 16-23)
- [x] Removed .gitkeep files
- [x] Updated package.json (removed test scripts and dependencies)
- [x] Created vercel.json
- [x] Created .vercelignore
- [x] Created DEPLOYMENT.md guide
- [x] Final build test passed ✅

## Before Deploying - ACTION REQUIRED ⚠️

### 1. Update Personal Information
Check and update these files with your actual information:

**data/profile.ts**
- [ ] Update name, title, bio
- [ ] Update location, email
- [ ] Update availability status
- [ ] Add resume PDF path (if you have one)
- [ ] Replace avatar image in `/public/images/avatar.jpg`

**data/socials.ts**
- [ ] Update GitHub username and URL
- [ ] Update LinkedIn username and URL (currently "#")
- [ ] Update X/Twitter username and URL (currently "#")
- [ ] Update email address
- [ ] Portfolio URL already set to: https://sushovan-ghosh.is-a.dev/

**data/site.ts**
- [ ] Update site name and tagline
- [ ] Update description
- [ ] Update domain URL
- [ ] Update OG image path

### 2. Review Content
- [ ] Review all projects in `data/projects.ts`
- [ ] Review all hackathons in `data/hackathons.ts`
- [ ] Review all blogs in `data/blogs.ts`
- [ ] Review all certifications in `data/certifications.ts`
- [ ] Review technologies in `data/technologies.ts`

### 3. Images Check
- [ ] All project images present in `/public/images/projects/`
- [ ] All hackathon images present in `/public/images/hackathons/` (pic1-pic15)
- [ ] All certification images present in `/public/images/certifications/`
- [ ] Avatar image at `/public/images/avatar.jpg`
- [ ] OG image for social sharing (if using custom)

### 4. Environment Variables
- [ ] Check if you need any API keys (Hashnode, LeetCode, etc.)
- [ ] Prepare `.env.local` variables for Vercel

### 5. Git Repository
- [ ] Ensure code is pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is set to public (or private if you have Vercel Pro)
- [ ] All changes committed

### 6. Final Local Test
- [ ] Run `npm run build` - should pass ✅
- [ ] Run `npm run start` to test production build locally
- [ ] Test all pages work correctly
- [ ] Test on mobile view
- [ ] Check browser console for errors

## Deployment Steps

Follow the guide in `DEPLOYMENT.md` for detailed instructions.

**Quick steps:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js settings
4. Add environment variables (if any)
5. Click Deploy!

## Post-Deployment Verification

After deployment:
- [ ] Visit your live URL
- [ ] Test all navigation links
- [ ] Verify all images load
- [ ] Test social links
- [ ] Check mobile responsiveness
- [ ] Verify smooth scrolling works
- [ ] Test all page routes:
  - [ ] / (Home)
  - [ ] /projects
  - [ ] /blog
  - [ ] /hackathons
  - [ ] /certifications
  - [ ] /recommendation

## Custom Domain (Optional)

If using `sushovan-ghosh.is-a.dev`:
- [ ] Add domain in Vercel dashboard
- [ ] Update DNS records as instructed by Vercel
- [ ] Wait for DNS propagation (can take up to 48 hours)
- [ ] Verify SSL certificate is active

---

## 🎉 Ready for Production!

Your portfolio is cleaned, optimized, and ready for deployment to Vercel.

**Current Status:**
- ✅ Build passing
- ✅ All unnecessary files removed
- ✅ Deployment config created
- ✅ TypeScript compilation successful
- ✅ Data validation passing
- ✅ 13 routes generated successfully

**Next Step:** Follow `DEPLOYMENT.md` to deploy!
