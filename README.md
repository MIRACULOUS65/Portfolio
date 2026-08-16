# 💼 Modern Developer Portfolio

A sleek, high-performance portfolio website built with Next.js 16, TypeScript, and Tailwind CSS.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/MIRACULOUS65/Portfolio.git

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Visit [http://localhost:3000](http://localhost:3000) to see your portfolio.

## ✨ Features

- **Modern Stack** - Next.js 16 App Router, TypeScript, Tailwind CSS 4
- **Smooth Animations** - Motion (Framer Motion), GSAP, Lenis smooth scroll
- **Fully Responsive** - Mobile-first design, optimized for all devices
- **Dark Mode** - Beautiful dark theme by default
- **Live Stats** - Real-time competitive programming stats integration
- **SEO Optimized** - Meta tags, Open Graph, sitemap
- **Fast Performance** - Static generation, image optimization, lazy loading

## 📁 Project Structure

```
Portfolio/
├── app/              # Next.js pages & API routes
├── components/       # React components
├── data/             # Content (projects, blogs, etc.)
├── public/images/    # Static images
├── styles/           # Global styles
└── types/            # TypeScript types
```

## 🎨 Customization

### 1. Update Your Information

Edit files in the `data/` folder:

| File | What to Update |
|------|----------------|
| `profile.ts` | Name, bio, email, location |
| `socials.ts` | GitHub, LinkedIn, Twitter links |
| `projects.ts` | Your projects |
| `hackathons.ts` | Hackathon participation |
| `certifications.ts` | Certifications |
| `site.ts` | SEO metadata |

### 2. Replace Images

Replace images in `public/images/`:
- `avatar.jpg` - Your profile photo
- `projects/` - Project screenshots  
- `hackathons/` - Event photos
- `certifications/` - Certificate images

### 3. Update Competitive Programming Usernames

Edit the API routes in `app/api/`:
- `codechef/route.ts` - CodeChef username
- `codeforces/route.ts` - Codeforces handle
- `leetcode/route.ts` - LeetCode username

## 🌐 Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variable:
   ```
   NEXT_PUBLIC_LANYARD_DISCORD_USER_ID=your_discord_id
   ```
5. Click "Deploy" - Done! 🎉

### Environment Variables

Only one environment variable is needed:

```bash
NEXT_PUBLIC_LANYARD_DISCORD_USER_ID=1237432736327925761
```

This shows your live Discord activity. All API routes work without keys!

## 📦 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Lint code
npm run format       # Format with Prettier
```

## 🛠️ Tech Stack

**Core:**
- Next.js 16.2 (App Router)
- TypeScript 5
- Tailwind CSS 4
- React 19

**Animations:**
- Motion (Framer Motion) 12.43
- GSAP 3.15
- Lenis 1.3 (smooth scroll)

**UI:**
- Lucide React (icons)
- next-themes (dark mode)
- OGL (3D graphics)

## 📱 Pages

- `/` - Home with hero, stats, and sections
- `/projects` - 3D scroll-morph gallery
- `/blog` - Blog posts with folder gallery
- `/hackathons` - Image stream corridor
- `/certifications` - Vertical stack viewer
- `/recommendation` - Testimonials

## 🎯 Performance

- ✅ Static page generation
- ✅ Image optimization
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Mobile optimized (Galaxy animation hidden on mobile)

## 📄 License

MIT License - feel free to use this for your own portfolio!

## 🙏 Credits

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Motion](https://motion.dev/)
- [Vercel](https://vercel.com/)

## 📧 Contact

**Sushovan Ghosh**
- GitHub: [@MIRACULOUS65](https://github.com/MIRACULOUS65)
- Email: sushovan1908@gmail.com
- Portfolio: [sushovan-ghosh.is-a.dev](https://sushovan-ghosh.is-a.dev)

---

⭐ **Star this repo if you find it helpful!**
