import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactCard } from "@/components/contact/ContactCard";
import type { Social } from "@/types";

const socials: Social[] = [
  {
    id: "social-github",
    platform: "GitHub",
    username: "alexdoe",
    url: "https://github.com/alexdoe",
    icon: "Github",
    visible: true,
  },
  {
    id: "social-linkedin",
    platform: "LinkedIn",
    username: "alexdoe",
    url: "https://www.linkedin.com/in/alexdoe",
    icon: "Linkedin",
    visible: true,
  },
  {
    id: "social-x",
    platform: "X",
    username: "alexdoe",
    url: "https://x.com/alexdoe",
    icon: "Twitter",
    visible: false,
  },
  {
    id: "social-email",
    platform: "Email",
    username: "hello@example.dev",
    url: "mailto:hello@example.dev",
    icon: "Mail",
    visible: true,
  },
  {
    id: "social-discord",
    platform: "Discord",
    username: "alexdoe",
    url: "https://discord.com/users/000000000000000000",
    icon: "MessageCircle",
    visible: true,
  },
];

describe("ContactCard", () => {
  it("renders exactly one contact method per fixed platform (Email, GitHub, LinkedIn, X)", () => {
    const { container } = render(
      <ContactCard
        socials={socials}
        resumeHref="/resume.pdf"
        ctaHref="mailto:hello@example.dev"
      />,
    );

    const methods = container.querySelectorAll("[data-slot='contact-method']");
    expect(methods).toHaveLength(4);

    const platforms = Array.from(methods).map((el) =>
      el.getAttribute("data-platform"),
    );
    expect(platforms).toEqual(["Email", "GitHub", "LinkedIn", "X"]);
  });

  it("ignores platforms outside the fixed contact set (Discord)", () => {
    const { container } = render(
      <ContactCard
        socials={socials}
        resumeHref="/resume.pdf"
        ctaHref="mailto:hello@example.dev"
      />,
    );

    expect(
      container.querySelector("[data-platform='Discord']"),
    ).not.toBeInTheDocument();
  });

  it("renders an active <a> link for a visible social entry", () => {
    render(
      <ContactCard
        socials={socials}
        resumeHref="/resume.pdf"
        ctaHref="mailto:hello@example.dev"
      />,
    );

    const github = screen.getByText("GitHub").closest("a");
    expect(github).toHaveAttribute("href", "https://github.com/alexdoe");
    expect(github).toHaveAttribute("data-disabled", "false");
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the Email method as a mailto link without target/rel", () => {
    render(
      <ContactCard
        socials={socials}
        resumeHref="/resume.pdf"
        ctaHref="mailto:hello@example.dev"
      />,
    );

    const email = screen.getByText("Email").closest("a");
    expect(email).toHaveAttribute("href", "mailto:hello@example.dev");
    expect(email).not.toHaveAttribute("target");
    expect(email).not.toHaveAttribute("rel");
  });

  it("renders a disabled placeholder button, not a link, for a non-visible entry", () => {
    render(
      <ContactCard
        socials={socials}
        resumeHref="/resume.pdf"
        ctaHref="mailto:hello@example.dev"
      />,
    );

    const x = screen.getByRole("button", { name: "X (unavailable)" });
    expect(x).toBeDisabled();
    expect(x).toHaveAttribute("data-disabled", "true");
  });

  it("still renders a disabled placeholder for a platform missing from the dataset entirely", () => {
    const missingLinkedIn = socials.filter(
      (social) => social.platform !== "LinkedIn",
    );

    render(
      <ContactCard
        socials={missingLinkedIn}
        resumeHref="/resume.pdf"
        ctaHref="mailto:hello@example.dev"
      />,
    );

    expect(
      screen.getByRole("button", { name: "LinkedIn (unavailable)" }),
    ).toBeInTheDocument();
  });

  it("renders a resume download action with the download attribute", () => {
    render(
      <ContactCard
        socials={socials}
        resumeHref="/resume.pdf"
        ctaHref="mailto:hello@example.dev"
      />,
    );

    const resumeLink = screen.getByText("Download Resume").closest("a");
    expect(resumeLink).toHaveAttribute("href", "/resume.pdf");
    expect(resumeLink).toHaveAttribute("download");
  });

  it("renders exactly one primary CTA linking to the supplied destination", () => {
    const { container } = render(
      <ContactCard
        socials={socials}
        resumeHref="/resume.pdf"
        ctaHref="mailto:hello@example.dev"
        ctaLabel="Say Hello"
      />,
    );

    const ctas = container.querySelectorAll("[data-slot='contact-primary-cta']");
    expect(ctas).toHaveLength(1);
    expect(ctas[0]).toHaveAttribute("href", "mailto:hello@example.dev");
    expect(screen.getByText("Say Hello")).toBeInTheDocument();
  });
});
