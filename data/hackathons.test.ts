import { describe, expect, it } from "vitest";

import { hackathons } from "@/data/hackathons";
import { technologies } from "@/data/technologies";

/**
 * Fixture-shape checks for the hackathon dataset (Requirements 4.1, 4.8).
 *
 * These assertions protect the guarantees downstream selectors and pages rely
 * on: unique ids/slugs, resolvable technology references, a total date ordering,
 * coverage of the absent-`achievement` case, and enough entries for the capped
 * preview to stay a strict subset of the full listing.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const technologyIds = new Set(technologies.map((technology) => technology.id));

describe("hackathons dataset", () => {
  it("uses unique kebab-case ids and slugs", () => {
    expect(new Set(hackathons.map((entry) => entry.id)).size).toBe(
      hackathons.length,
    );
    expect(new Set(hackathons.map((entry) => entry.slug)).size).toBe(
      hackathons.length,
    );

    for (const entry of hackathons) {
      expect(entry.id).toMatch(KEBAB_CASE);
      expect(entry.slug).toMatch(KEBAB_CASE);
    }
  });

  it("holds enough entries for a capped preview to be a strict subset", () => {
    expect(hackathons.length).toBeGreaterThanOrEqual(6);
  });

  it("dates every entry as a distinct YYYY-MM-DD string", () => {
    for (const entry of hackathons) {
      expect(entry.date).toMatch(ISO_DATE);
    }

    const dates = hackathons.map((entry) => entry.date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("covers both the present and absent achievement cases", () => {
    const withAchievement = hackathons.filter(
      (entry) => entry.achievement !== undefined,
    );
    const withoutAchievement = hackathons.filter(
      (entry) => entry.achievement === undefined,
    );

    expect(withAchievement.length).toBeGreaterThanOrEqual(3);
    expect(withoutAchievement.length).toBeGreaterThanOrEqual(1);
  });

  it("references only technology ids that resolve in the technology dataset", () => {
    for (const entry of hackathons) {
      expect(entry.technologies.length).toBeGreaterThanOrEqual(3);

      for (const id of entry.technologies) {
        expect(
          technologyIds.has(id),
          `unknown technology id "${id}" in "${entry.id}"`,
        ).toBe(true);
      }
    }
  });

  it("gives every entry a name, organizer, description, location, and image paths", () => {
    for (const entry of hackathons) {
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.organizer.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.location.length).toBeGreaterThan(0);
      expect(entry.images.length).toBeGreaterThan(0);

      for (const image of entry.images) {
        expect(image).toMatch(/^\/images\/hackathons\/pic[1-6]\.webp$/);
      }
    }
  });

  it("varies location, team size, and link coverage across entries", () => {
    const remote = hackathons.filter((entry) =>
      /^(online|remote)$/i.test(entry.location),
    );
    const inPerson = hackathons.filter(
      (entry) => !/^(online|remote)$/i.test(entry.location),
    );
    const soloOrUnlisted = hackathons.filter(
      (entry) => entry.teamMembers.length <= 1,
    );
    const withoutLinks = hackathons.filter(
      (entry) => entry.demo === undefined && entry.github === undefined,
    );

    expect(remote.length).toBeGreaterThanOrEqual(1);
    expect(inPerson.length).toBeGreaterThanOrEqual(1);
    expect(soloOrUnlisted.length).toBeGreaterThanOrEqual(1);
    expect(withoutLinks.length).toBeGreaterThanOrEqual(1);
  });
});
