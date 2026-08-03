import { describe, expect, it } from "vitest";

import { certifications } from "@/data/certifications";
import { technologies } from "@/data/technologies";

/**
 * Fixture-shape checks for the real certification dataset (Requirements 4.1,
 * 4.7). The dataset holds the three certifications actually earned so far
 * (100xDevs Cohort 3, and two Udemy courses), all `featured: true` and all
 * carrying a real, publicly verifiable credential link — there is no
 * non-featured or link-less entry to exercise those branches against, since
 * this is real content rather than a synthetic fixture.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const technologyIds = new Set(technologies.map((technology) => technology.id));

describe("certifications dataset", () => {
  it("uses unique kebab-case ids", () => {
    expect(new Set(certifications.map((entry) => entry.id)).size).toBe(
      certifications.length,
    );

    for (const { id } of certifications) {
      expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("holds exactly the three real, currently-held certifications", () => {
    expect(certifications).toHaveLength(3);
    expect(certifications.map((entry) => entry.id)).toEqual([
      "100xdevs-cohort-3",
      "udemy-complete-web-development-course",
      "udemy-python-bootcamp",
    ]);
    expect(certifications.every((entry) => entry.featured)).toBe(true);
  });

  it("dates every entry as a distinct YYYY-MM-DD issue date", () => {
    for (const { id, issueDate } of certifications) {
      expect(issueDate, `issueDate of ${id}`).toMatch(ISO_DATE);
    }

    const dates = certifications.map((entry) => entry.issueDate);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("gives every entry a real, https credential link", () => {
    for (const { id, credentialUrl } of certifications) {
      expect(credentialUrl, `credentialUrl of ${id}`).toMatch(/^https:\/\/\S+$/);
    }
  });

  it("resolves every technology reference against the technology dataset", () => {
    for (const { id, technologies: refs } of certifications) {
      expect(refs.length, `technologies of ${id}`).toBeGreaterThan(0);
      expect(new Set(refs).size, `duplicate technologies in ${id}`).toBe(
        refs.length,
      );

      for (const ref of refs) {
        expect(
          technologyIds.has(ref),
          `unknown technology "${ref}" in ${id}`,
        ).toBe(true);
      }
    }
  });

  it("points every badge image at a real asset under public/images/certifications/", () => {
    for (const { badgeImage } of certifications) {
      expect(badgeImage).toMatch(/^\/images\/certifications\/.+\.webp$/);
    }
  });

  it("gives every entry a title and issuer", () => {
    for (const { title, issuer } of certifications) {
      expect(title.trim().length).toBeGreaterThan(0);
      expect(issuer.trim().length).toBeGreaterThan(0);
    }
  });
});
