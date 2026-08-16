# 🚀 Modern Portfolio Website

[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

A modern, responsive portfolio website built with Next.js 16, TypeScript, and Tailwind CSS. Features smooth animations, dark mode, and a clean design optimized for performance.

## ✨ Features

- 🎨 **Modern Design** - Clean, minimalist interface with glassmorphic effects
- 🌗 **Dark Mode** - Default dark theme with smooth transitions
- 📱 **Fully Responsive** - Optimized for all devices and screen sizes
- ⚡ **Performance** - Static generation, image optimization, and lazy loading
- 🎭 **Smooth Animations** - Powered by Motion (Framer Motion) and GSAP
- 🎯 **Interactive Components** - 3D cards, image streams, vertical stacks
- 📊 **Live Stats** - Real-time competitive programming stats from LeetCode, CodeChef, Codeforces
- 📝 **Blog Integration** - Hashnode blog integration with preview cards
- 🔍 **SEO Optimized** - Meta tags, Open Graph, structured data
- ♿ **Accessible** - WCAG compliant with semantic HTML

## 🎯 Sections

- **Home** - Hero section with animated introduction and social links
- **Projects** - Scroll-morph 3D gallery showcasing projects
- **Blog** - Latest articles with interactive folder gallery
- **Hackathons** - Image stream corridor with hackathon photos
- **Certifications** - Vertical stack card viewer
- **Tech Stack** - Animated marquee of technologies
- **Competitive Programming** - Live stats and achievements

## 🛠️ Tech Stack

### Core
- **Framework:** Next.js 16.2.12 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Animations:** Motion (Framer Motion) 12.43.0, GSAP 3.15.0
- **Smooth Scroll:** Lenis 1.3.26

### UI Components
- **Icons:** Lucide React 1.28.0
- **Themes:** next-themes 0.4.6
- **Utilities:** clsx, tailwind-merge, class-variance-authority

### Deployment
- **Platform:** Vercel
- **CI/CD:** Automatic deployments on push

## 📦 Project Structure

```
Portfolio/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (competitive programming)
│   ├── blog/              # Blog page
│   ├── certifications/    # Certifications page
│   ├── hackathons/        # Hackathons page
│   ├── projects/          # Projects page
│   └── recommendation/    # Recommendation page
├── components/            # React components
│   ├── blog-preview/     # Blog cards and previews
│   ├── certifications/   # Certification components
│   ├── competitive-programming/  # CP stats
│   ├── contact/          # Contact section
│   ├── education/        # Education cards
│   ├── featured-projects/ # Project selectors
│   ├── footer/           # Footer component
│   ├── hackathons/       # Hackathon cards
│   ├── hero/             # Hero section components
│   ├── navbar/           # Navigation bar
│   ├── shared/           # Shared components (Card, Badge, etc.)
│   ├── tech-stack/       # Technology marquee
│   ├── theme/            # Theme provider
│   └── ui/               # UI primitives
├── data/                  # Content data (TypeScript files)
│   ├── blogs.ts          # Blog posts
│   ├── certifications.ts # Certifications
│   ├── education.ts      # Education history
│   ├── hackathons.ts     # Hackathon entries
│   ├── navigation.ts     # Navigation links
│   ├── profile.ts        # Personal profile
│   ├── projects.ts       # Project entries
│   ├── site.ts           # Site metadata
│   ├── socials.ts        # Social links
│   └── technologies.ts   # Technology stack
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and data access
├── public/               # Static assets
│   └── images/          # Images (projects, hackathons, etc.)
├── sections/             # Page sections
├── styles/               # Global styles
├── types/                # TypeScript type definitions
└── utils/                # Helper utilities

```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MIRACULOUS65/Portfolio.git
   cd Portfolio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## 🎨 Customization

### Update Personal Information

Edit the following files in the `data/` directory:

- **`profile.ts`** - Name, title, bio, location, email
- **`socials.ts`** - Social media links (GitHub, LinkedIn, etc.)
- **`site.ts`** - Site metadata and SEO
- **`projects.ts`** - Your projects
- **`hackathons.ts`** - Hackathon participation
- **`blogs.ts`** - Blog posts
- **`certifications.ts`** - Certifications
- **`technologies.ts`** - Tech stack

### Replace Images

Replace images in `public/images/`:
- `avatar.jpg` - Your profile picture
- `projects/` - Project screenshots
- `hackathons/` - Hackathon photos
- `certifications/` - Certification badges

## 📤 Deployment

This portfolio is optimized for deployment on Vercel.

### Quick Deploy

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Click "Deploy"

3. **Done!** Your portfolio is live 🎉

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 🌐 Live Demo

Visit: [https://sushovan-ghosh.is-a.dev](https://sushovan-ghosh.is-a.dev)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Motion](https://motion.dev/) - Animation library
- [Vercel](https://vercel.com/) - Hosting platform
- [Lucide](https://lucide.dev/) - Icon library

## 📧 Contact

- **GitHub:** [@MIRACULOUS65](https://github.com/MIRACULOUS65)
- **Email:** sushovan1908@gmail.com
- **Portfolio:** [sushovan-ghosh.is-a.dev](https://sushovan-ghosh.is-a.dev)

---

**Built with ❤️ by Sushovan Ghosh**

⭐ Star this repo if you find it helpful!
