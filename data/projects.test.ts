import { describe, expect, it } from "vitest";

import { featuredProjects } from "@/data/featured-projects";
import { projects } from "@/data/projects";
import { technologies } from "@/data/technologies";

/**
 * Fixture-shape and referential-integrity checks for the project dataset and the
 * Featured Projects config (Requirements 4.1, 4.4, 4.5).
 *
 * These assertions lock in the guarantees downstream selectors rely on: ids
 * resolve, featured references are id-only and totally ordered, and the archived
 * / non-featured / empty-`relatedProjects` cases all exist. The generalized
 * version of the reference check is Property 2 (task 9.9); this file pins the
 * committed data.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const projectIds = new Set(projects.map((project) => project.id));
const technologyIds = new Set(technologies.map((technology) => technology.id));
const byId = new Map(projects.map((project) => [project.id, project]));

describe("projects dataset", () => {
  it("uses unique kebab-case ids and slugs", () => {
    expect(projectIds.size).toBe(projects.length);
    expect(new Set(projects.map((project) => project.slug)).size).toBe(
      projects.length,
    );

    for (const project of projects) {
      expect(project.id).toMatch(KEBAB_CASE);
      expect(project.slug).toMatch(KEBAB_CASE);
    }
  });

  it("references only existing technology ids", () => {
    for (const project of projects) {
      expect(project.technologies.length).toBeGreaterThan(0);

      for (const id of project.technologies) {
        expect(technologyIds.has(id), `unknown technology id "${id}"`).toBe(
          true,
        );
      }
    }
  });

  it("references only existing, non-self project ids in relatedProjects", () => {
    for (const project of projects) {
      for (const id of project.relatedProjects) {
        expect(projectIds.has(id), `unknown project id "${id}"`).toBe(true);
        expect(id).not.toBe(project.id);
      }
    }
  });

  it("covers the archived, non-featured, and empty-relatedProjects cases", () => {
    const archived = projects.filter((project) => project.archived);
    const nonFeatured = projects.filter((project) => !project.featured);
    const withRelated = projects.filter(
      (project) => project.relatedProjects.length > 0,
    );
    const withoutRelated = projects.filter(
      (project) => project.relatedProjects.length === 0,
    );
    const pinned = projects.filter((project) => project.pinned);

    expect(archived.length).toBeGreaterThanOrEqual(1);
    expect(nonFeatured.length).toBeGreaterThanOrEqual(1);
    expect(withRelated.length).toBeGreaterThanOrEqual(1);
    // The popular/pinned fallback needs both an empty case to trigger it and
    // pinned projects to return (Requirements 19.3, 19.5).
    expect(withoutRelated.length).toBeGreaterThanOrEqual(1);
    expect(pinned.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps archived and status mutually consistent", () => {
    for (const project of projects) {
      expect(project.status === "Archived").toBe(project.archived);
    }
  });

  it("makes the archived exclusion observable through a shared search term", () => {
    const term = "dashboard";
    const matches = (text: string) => text.toLowerCase().includes(term);
    const matching = projects.filter(
      (project) =>
        matches(project.title) ||
        matches(project.description) ||
        matches(project.shortDescription),
    );

    expect(matching.some((project) => project.archived)).toBe(true);
    expect(matching.some((project) => !project.archived)).toBe(true);
  });

  it("covers both the present and absent youtubeVideoId cases", () => {
    expect(
      projects.some((project) => project.youtubeVideoId !== undefined),
    ).toBe(true);
    expect(
      projects.some((project) => project.youtubeVideoId === undefined),
    ).toBe(true);
  });

  it("offers more than one category and more than one status to filter by", () => {
    expect(
      new Set(projects.map((project) => project.category)).size,
    ).toBeGreaterThan(1);
    expect(
      new Set(projects.map((project) => project.status)).size,
    ).toBeGreaterThan(1);
  });

  it("dates every project with YYYY-MM-DD strings, completion never before start", () => {
    for (const project of projects) {
      expect(project.startDate).toMatch(ISO_DATE);

      if (project.completionDate !== undefined) {
        expect(project.completionDate).toMatch(ISO_DATE);
        expect(
          project.completionDate >= project.startDate,
          `${project.id} completes before it starts`,
        ).toBe(true);
      }
    }
  });

  it("populates every detail-page content array and image path", () => {
    for (const project of projects) {
      for (const field of [
        "gallery",
        "features",
        "challenges",
        "learnings",
        "architecture",
        "screenshots",
      ] as const) {
        expect(
          project[field].length,
          `${project.id}.${field} is empty`,
        ).toBeGreaterThan(1);
      }

      for (const path of [
        project.thumbnail,
        project.heroImage,
        ...project.gallery,
        ...project.screenshots,
      ]) {
        expect(path).toMatch(new RegExp(`^/images/projects/${project.slug}/`));
      }
    }
  });
});

describe("featured projects config", () => {
  it("holds id references only — no embedded Project data", () => {
    for (const entry of featuredProjects) {
      expect(Object.keys(entry).sort()).toEqual(["order", "projectId"]);
      expect(typeof entry.projectId).toBe("string");
      expect(typeof entry.order).toBe("number");
    }
  });

  it("resolves every projectId to a project marked featured", () => {
    for (const entry of featuredProjects) {
      const project = byId.get(entry.projectId);

      expect(project, `unknown projectId "${entry.projectId}"`).toBeDefined();
      expect(project?.featured).toBe(true);
    }
  });

  it("references every featured project exactly once", () => {
    const referenced = featuredProjects.map((entry) => entry.projectId);
    const featuredIds = projects
      .filter((project) => project.featured)
      .map((project) => project.id);

    expect(new Set(referenced).size).toBe(referenced.length);
    expect([...referenced].sort()).toEqual([...featuredIds].sort());
  });

  it("orders entries with distinct values and stays a strict subset of all projects", () => {
    const orders = featuredProjects.map((entry) => entry.order);

    expect(new Set(orders).size).toBe(orders.length);
    expect(featuredProjects.length).toBeLessThan(projects.length);
  });

  it("lists entries in `order` sequence — the lowest `order` is first, and is the default selection", () => {
    const sorted = [...featuredProjects].sort((a, b) => a.order - b.order);

    expect(featuredProjects.map((entry) => entry.projectId)).toEqual(
      sorted.map((entry) => entry.projectId),
    );
    // The default selection is the lowest `order`, which the config already
    // lists first (aerosense, the resume's first-listed project).
    expect(sorted[0]?.projectId).toBe(featuredProjects[0]?.projectId);
  });

  it("gives every featured project a youtubeVideoId for the VideoPlayer", () => {
    for (const entry of featuredProjects) {
      expect(byId.get(entry.projectId)?.youtubeVideoId).toBeTruthy();
    }
  });
});
