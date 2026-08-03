import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CertificationCard } from "@/components/certifications/CertificationCard";
import type { Certification } from "@/types";

const withCredential: Certification = {
  id: "sample-cert",
  title: "AWS Certified Solutions Architect – Associate",
  issuer: "Amazon Web Services",
  issueDate: "2024-03-12",
  expirationDate: "2027-03-12",
  credentialId: "AWS-SAA-4193827",
  credentialUrl: "https://www.credly.com/badges/placeholder-aws-saa",
  badgeImage:
    "/images/certifications/aws-certified-solutions-architect-associate.svg",
  technologies: ["aws", "docker"],
  featured: true,
};

const withoutCredential: Certification = {
  ...withCredential,
  id: "sample-cert-no-link",
  title: "Internal Frontend Performance Specialist",
  credentialId: undefined,
  credentialUrl: undefined,
};

describe("CertificationCard", () => {
  it("renders the issuer, title, badge image, and issue date", () => {
    render(<CertificationCard certification={withCredential} />);

    expect(
      screen.getByRole("heading", { name: withCredential.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(withCredential.issuer)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: `${withCredential.title} badge` }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mar 12, 2024")).toBeInTheDocument();
  });

  it("uses a real <time> element with a matching dateTime attribute", () => {
    render(<CertificationCard certification={withCredential} />);

    const time = screen.getByText("Mar 12, 2024");
    expect(time.tagName.toLowerCase()).toBe("time");
    expect(time).toHaveAttribute("dateTime", withCredential.issueDate);
  });

  it("renders an external credential link when one is available", () => {
    render(<CertificationCard certification={withCredential} />);

    const link = screen.getByRole("link", {
      name: new RegExp(`View credential for ${withCredential.title}`),
    });
    expect(link).toHaveAttribute("href", withCredential.credentialUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("omits the credential link entirely when none is available", () => {
    render(<CertificationCard certification={withoutCredential} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: withoutCredential.title }),
    ).toBeInTheDocument();
  });
});
