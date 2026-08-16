import type { Social } from "@/types";

/**
 * The developer's social channels (Requirements 4.1, 4.14).
 *
 * Contains exactly one entry per known `SocialPlatform` — GitHub, LinkedIn, X,
 * Email, Portfolio. `SocialLinks` renders one button per known platform
 * regardless of this dataset (Requirement 7.5, design.md Property 5), so a
 * complete set here keeps the data and the rendered UI in agreement. Discord
 * was removed from both the platform list and this dataset per an explicit
 * design request — Portfolio took its place in the rendered row.
 *
 * `visible: false` does **not** remove a channel: it renders in the same
 * position as a disabled placeholder button so visitors still see the full set
 * of channels that exist.
 *
 * `icon` values are `lucide-react` icon names. `id`s are stable kebab-case and
 * double as React keys.
 */
export const socials: Social[] = [
  {
    id: "social-github",
    platform: "GitHub",
    username: "MIRACULOUS65",
    url: "https://github.com/MIRACULOUS65",
    icon: "Github",
    visible: true,
  },
  {
    id: "social-linkedin",
    platform: "LinkedIn",
    username: "sushovan1908",
    url: "#",
    icon: "Linkedin",
    visible: true,
  },
  {
    id: "social-x",
    platform: "X",
    username: "sushovan1908",
    url: "#",
    icon: "Twitter",
    visible: true,
  },
  {
    id: "social-email",
    platform: "Email",
    username: "sushovan1908@gmail.com",
    url: "mailto:sushovan1908@gmail.com",
    icon: "Mail",
    visible: true,
  },
  {
    id: "social-portfolio",
    platform: "Portfolio",
    username: "sushovan1908",
    url: "https://sushovan-ghosh.is-a.dev/",
    icon: "Globe",
    visible: true,
  },
];
