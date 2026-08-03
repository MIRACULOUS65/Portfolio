import type { Profile } from "@/types";

/**
 * The developer's personal information — the single source for the HeroSection
 * (avatar, name, role, bio, availability), the ContactSection resume download,
 * and the Footer. No component hardcodes any of these values
 * (Requirements 4.1, 4.14, 4.3).
 *
 * This is placeholder content for the portfolio template: replace every field
 * below with your own details. `avatar` and `resume` point at `public/` paths
 * that are intentionally not committed yet (`public/images/` exists but is
 * empty), so drop `avatar.jpg` into `public/images/` and `resume.pdf` into
 * `public/` — or repoint these fields — before shipping.
 */
export const profile: Profile = {
  name: "Sushovan",
  role: "Aspiring Full-Stack Developer / Web3 & AI Enthusiast",
  bio:
    "I build modern, scalable web applications using Next.js, React, and " +
    "Node.js, with a growing focus on Web3 and AI-powered tools. I care " +
    "about clean architecture and shipping products that actually work end " +
    "to end.",
  avatar: "/images/avatar.jpg",
  location: "Kolkata, India",
  resume: "/resume.pdf",
  email: "sushovan1908@gmail.com",
  availability: "Open to internships and full-time roles",
};
