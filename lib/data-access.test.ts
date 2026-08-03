import { describe, expect, it } from "vitest";

import { blogs } from "@/data/blogs";
import { certifications } from "@/data/certifications";
import { competitiveProgramming } from "@/data/competitive-programming";
import { education } from "@/data/education";
import { featuredProjects } from "@/data/featured-projects";
import { hackathons } from "@/data/hackathons";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import { technologies } from "@/data/technologies";
import {
  filterProjects,
  getAllBlogs,
  getAllCertifications,
  getAllCompetitiveProgrammingPlatforms,
  getAllEducation,
  getAllHackathons,
  getAllProjects,
  getAllPublishedBlogs,
  getAllTechnologies,
  getBlogBySlug,
  getEducationSortedByDate,
  getFeaturedCertifications,
  getFeaturedProjectsResolved,
  getHackathonsPreview,
  getPrevNextBlog,
  getProjectById,
  getProjectBySlug,
  getRecentPublishedBlogs,
  getRelatedOrPopularProjects,
  getSiteConfig,
  getTechnologyById,
} from "@/lib/data-access";
import type { Project } from "@/types";

/**
 * Example-based checks for the general data-access getters (Requirements 4.2,
 * 4.16, 22.3). The generalized determinism statement is Property 19 (task 9.2);
 * this file pins the concrete contract those selectors expose:
 *
 * - collection selectors mirror their dataset exactly and hand back a *copy*
 * - lookups return the canonical record, so resolved id references are not
 *   divergent clones
 * - a miss is `undefined`, not `null` and not a throw
 */

describe("collection selectors", () => {
  it("mirror their underlying dataset in order", () => {
    expect(getAllProjects()).toEqual(projects);
    expect(getAllTechnologies()).toEqual(technologies);
    expect(getAllBlogs()).toEqual(blogs);
    expect(getAllCertifications()).toEqual(certifications);
    expect(getAllHackathons()).toEqual(hackathons);
    expect(getAllEducation()).toEqual(education);
    expect(getAllCompetitiveProgrammingPlatforms()).toEqual(
      competitiveProgramming,
    );
  });

  it("include unfiltered entries — archived projects and draft blogs", () => {
    expect(getAllProjects().some((project) => project.archived)).toBe(true);
    expect(getAllBlogs().some((blog) => blog.draft)).toBe(true);
  });

  it("return a defensive copy rather than the live dataset array", () => {
    const first = getAllProjects();
    const second = getAllProjects();

    expect(first).not.toBe(second);
    expect(first).not.toBe(projects);
    expect(first).toEqual(second);
  });

  it("keep element identity, so mutating the returned array cannot reach data/", () => {
    const mutable = getAllProjects() as Project[];
    const originalLength = projects.length;

    expect(mutable[0]).toBe(projects[0]);
    mutable.length = 0;

    expect(projects).toHaveLength(originalLength);
    expect(getAllProjects()).toHaveLength(originalLength);
  });
});

describe("lookup selectors", () => {
  it("resolve ids and slugs to the canonical record", () => {
    const project = projects[0]!;

    expect(getProjectById(project.id)).toBe(project);
    expect(getProjectBySlug(project.slug)).toBe(project);
    expect(getTechnologyById(technologies[0]!.id)).toBe(technologies[0]);
    expect(getBlogBySlug(blogs[0]!.slug)).toBe(blogs[0]);
  });

  it("resolve every project id referenced by relatedProjects", () => {
    for (const project of projects) {
      for (const relatedId of project.relatedProjects) {
        expect(getProjectById(relatedId)).toBeDefined();
      }
    }
  });

  it("return undefined for unknown keys instead of throwing", () => {
    expect(getProjectById("no-such-project")).toBeUndefined();
    expect(getProjectBySlug("no-such-project")).toBeUndefined();
    expect(getTechnologyById("no-such-technology")).toBeUndefined();
    expect(getBlogBySlug("no-such-post")).toBeUndefined();
  });

  it("finds a draft post by slug, so callers can tell draft from missing", () => {
    const draft = blogs.find((blog) => blog.draft)!;

    expect(getBlogBySlug(draft.slug)).toBe(draft);
    expect(getBlogBySlug(`${draft.slug}-missing`)).toBeUndefined();
  });
});

describe("getFeaturedProjectsResolved", () => {
  it("orders by `order` ascending, not by position in the data file", () => {
    expect(getFeaturedProjectsResolved().map((project) => project.id)).toEqual([
      "aerosense",
      "novaaid",
      "digital-health-records",
    ]);
  });

  it("puts the lowest-`order` project first, as the default selection", () => {
    const lowest = [...featuredProjects].sort((a, b) => a.order - b.order)[0]!;

    expect(getFeaturedProjectsResolved()[0]?.id).toBe(lowest.projectId);
  });

  it("resolves every configured reference, with no hardcoded count", () => {
    expect(getFeaturedProjectsResolved()).toHaveLength(featuredProjects.length);
  });

  it("returns the canonical Project records, not clones", () => {
    for (const project of getFeaturedProjectsResolved()) {
      expect(project).toBe(getProjectById(project.id));
    }
  });

  it("returns a fresh, deep-equal array per call and never mutates the dataset", () => {
    const configOrderBefore = featuredProjects.map((entry) => entry.projectId);
    const first = getFeaturedProjectsResolved();
    const second = getFeaturedProjectsResolved();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
    expect(featuredProjects.map((entry) => entry.projectId)).toEqual(
      configOrderBefore,
    );
  });

  it("stays a strict subset of all projects", () => {
    const resolved = getFeaturedProjectsResolved();

    expect(resolved.length).toBeLessThan(getAllProjects().length);
    for (const project of resolved) {
      expect(projects).toContain(project);
    }
  });
});

const NON_ARCHIVED_ORDER = [
  "aerosense",
  "novaaid",
  "digital-health-records",
  "nebula-analytics",
  "pulse-design-system",
  "orbital-vision",
  "atlas-edge-cache",
  "ledger-lens",
  "trailhead-mobile",
  "signal-mesh",
];

describe("filterProjects", () => {
  const ids = (result: readonly Project[]) => result.map((p) => p.id);

  it("returns every non-archived project in dataset order with no criteria", () => {
    expect(ids(filterProjects())).toEqual(NON_ARCHIVED_ORDER);
    expect(filterProjects({})).toEqual(filterProjects());
  });

  it("excludes the archived project unconditionally", () => {
    const archived = projects.find((project) => project.archived)!;

    expect(archived.id).toBe("beacon-status-page");
    for (const criteria of [
      {},
      { search: "dashboard" },
      { category: archived.category },
      { status: archived.status },
      { search: "beacon", category: archived.category },
    ]) {
      expect(filterProjects(criteria)).not.toContain(archived);
    }
  });

  it("matches title and description case-insensitively, as substrings", () => {
    // "dashboard" appears in the archived project's title and in
    // `nebula-analytics`'s description, so the exclusion is observable.
    expect(ids(filterProjects({ search: "dashboard" }))).toEqual([
      "aerosense",
      "nebula-analytics",
    ]);
    expect(filterProjects({ search: "DASHBOARD" })).toEqual(
      filterProjects({ search: "dashboard" }),
    );
    expect(ids(filterProjects({ search: "nEbUlA" }))).toEqual([
      "nebula-analytics",
    ]);
    // Title-only match: "Design System" appears in the title of
    // `pulse-design-system` and nowhere in its description.
    const pulse = getProjectById("pulse-design-system")!;

    expect(pulse.description.toLowerCase()).not.toContain("design system");
    expect(ids(filterProjects({ search: "Design System" }))).toEqual([
      "pulse-design-system",
    ]);
  });

  it("does not search shortDescription", () => {
    const project = getProjectById("trailhead-mobile")!;
    const term = "hiking companion";

    expect(project.shortDescription.toLowerCase()).toContain(term);
    expect(project.title.toLowerCase()).not.toContain(term);
    expect(project.description.toLowerCase()).not.toContain(term);
    expect(filterProjects({ search: term })).toEqual([]);
  });

  it("treats a blank or whitespace-only search as absent", () => {
    expect(filterProjects({ search: "" })).toEqual(filterProjects());
    expect(filterProjects({ search: "   " })).toEqual(filterProjects());
    expect(filterProjects({ search: "\n\t" })).toEqual(filterProjects());
    expect(filterProjects({ category: "", status: "" })).toEqual(
      filterProjects(),
    );
  });

  it("filters by category and by status", () => {
    expect(ids(filterProjects({ category: "Tooling" }))).toEqual([
      "pulse-design-system",
      "atlas-edge-cache",
    ]);
    expect(ids(filterProjects({ status: "In Progress" }))).toEqual([
      "atlas-edge-cache",
      "signal-mesh",
    ]);
    // Case-insensitive and trimmed, since the values arrive from a URL.
    expect(filterProjects({ category: " tooling " })).toEqual(
      filterProjects({ category: "Tooling" }),
    );
    expect(filterProjects({ status: "in progress" })).toEqual(
      filterProjects({ status: "In Progress" }),
    );
  });

  it("combines criteria with AND, not OR", () => {
    expect(
      ids(filterProjects({ search: "cache", category: "Tooling" })),
    ).toEqual(["atlas-edge-cache"]);
    // `pulse-design-system` matches the category but not the search term, and
    // `nebula-analytics` matches neither — an OR would return both.
    expect(
      ids(
        filterProjects({
          category: "Tooling",
          status: "In Progress",
        }),
      ),
    ).toEqual(["atlas-edge-cache"]);
    expect(filterProjects({ search: "cache", category: "Web3" })).toHaveLength(
      0,
    );
  });

  it("returns [] for status Archived rather than the archived project", () => {
    expect(filterProjects({ status: "Archived" })).toEqual([]);
  });

  it("returns [] for unknown filter values instead of throwing or ignoring them", () => {
    expect(filterProjects({ category: "Banana" })).toEqual([]);
    expect(filterProjects({ status: "Cancelled" })).toEqual([]);
    expect(filterProjects({ search: "no-such-project-anywhere" })).toEqual([]);
    expect(() => filterProjects({ category: "__proto__" })).not.toThrow();
    expect(filterProjects({ category: "__proto__" })).toEqual([]);
  });

  it("stays a subsequence of all projects and returns canonical records", () => {
    const result = filterProjects({ search: "e" });

    expect(result.length).toBeGreaterThan(1);
    expect(ids(result)).toEqual(
      projects
        .filter((project) => result.includes(project))
        .map((project) => project.id),
    );
    for (const project of result) {
      expect(project).toBe(getProjectById(project.id));
    }
  });

  it("returns a fresh array per call and never mutates the dataset", () => {
    const datasetOrderBefore = projects.map((project) => project.id);
    const first = filterProjects({ category: "Tooling" });
    const second = filterProjects({ category: "Tooling" });

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
    expect(projects.map((project) => project.id)).toEqual(datasetOrderBefore);
  });
});

const PINNED_ORDER = [
  "nebula-analytics",
  "pulse-design-system",
  "ledger-lens",
  "signal-mesh",
];

describe("getRelatedOrPopularProjects", () => {
  const ids = (result: readonly Project[]) => result.map((p) => p.id);

  it("resolves relatedProjects in declaration order", () => {
    const project = getProjectById("nebula-analytics")!;

    expect(ids(getRelatedOrPopularProjects(project))).toEqual(
      project.relatedProjects,
    );
  });

  it("returns canonical records, not clones", () => {
    for (const related of getRelatedOrPopularProjects(
      getProjectById("nebula-analytics")!,
    )) {
      expect(related).toBe(getProjectById(related.id));
    }
  });

  it("falls back to the pinned projects when relatedProjects is empty", () => {
    for (const id of ["ledger-lens", "signal-mesh"]) {
      const project = getProjectById(id)!;

      expect(project.relatedProjects).toEqual([]);
      expect(ids(getRelatedOrPopularProjects(project))).toEqual(
        PINNED_ORDER.filter((pinnedId) => pinnedId !== id),
      );
    }
  });

  it("returns the pinned subset when called with no project at all", () => {
    expect(ids(getRelatedOrPopularProjects())).toEqual(
      PINNED_ORDER.slice(0, 3),
    );
  });

  it("never includes the project itself, on either branch", () => {
    for (const project of projects) {
      expect(
        ids(getRelatedOrPopularProjects(project, projects.length)),
      ).not.toContain(project.id);
    }
  });

  it("never includes an archived project", () => {
    for (const project of projects) {
      expect(
        getRelatedOrPopularProjects(project, projects.length).some(
          (related) => related.archived,
        ),
      ).toBe(false);
    }
  });

  it("still resolves references for an archived project being viewed", () => {
    const archived = projects.find((project) => project.archived)!;

    expect(ids(getRelatedOrPopularProjects(archived))).toEqual(
      archived.relatedProjects,
    );
  });

  it("caps the result, and a cap of 0 does not engage the fallback", () => {
    const ledgerLens = getProjectById("ledger-lens")!;

    expect(getRelatedOrPopularProjects(ledgerLens, 2)).toHaveLength(2);
    expect(getRelatedOrPopularProjects(ledgerLens, 0)).toEqual([]);
    expect(
      getRelatedOrPopularProjects(getProjectById("nebula-analytics")!, 0),
    ).toEqual([]);
  });

  it("clamps a nonsense cap instead of throwing", () => {
    const defaulted = getRelatedOrPopularProjects();

    expect(getRelatedOrPopularProjects(undefined, Number.NaN)).toEqual(
      defaulted,
    );
    expect(getRelatedOrPopularProjects(undefined, 3.9)).toEqual(defaulted);
    expect(getRelatedOrPopularProjects(undefined, -1)).toEqual([]);
    expect(getRelatedOrPopularProjects(undefined, 100)).toEqual(
      PINNED_ORDER.map((id) => getProjectById(id)),
    );
  });

  it("returns a fresh array per call and never mutates the dataset", () => {
    const datasetOrderBefore = projects.map((project) => project.id);
    const first = getRelatedOrPopularProjects();
    const second = getRelatedOrPopularProjects();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(projects.map((project) => project.id)).toEqual(datasetOrderBefore);
  });
});

const PUBLISHED_ORDER = [
  "server-components-data-flow",
  "type-safe-data-layer",
  "property-based-testing-react",
  "theme-tokens-with-tailwind",
  "image-and-font-budgets",
  "accessible-motion",
];

describe("getAllPublishedBlogs", () => {
  it("returns every non-draft post, newest first", () => {
    expect(getAllPublishedBlogs().map((blog) => blog.slug)).toEqual(
      PUBLISHED_ORDER,
    );
  });

  it("excludes the draft even though it holds the newest date", () => {
    const draft = blogs.find((blog) => blog.draft)!;
    const published = getAllPublishedBlogs();

    expect(published).not.toContain(draft);
    expect(published.every((blog) => blog.draft === false)).toBe(true);
    expect(published).toHaveLength(blogs.length - 1);
    expect(draft.publishedDate > published[0]!.publishedDate).toBe(true);
  });

  it("returns a fresh array of canonical records and never sorts the dataset", () => {
    const datasetOrderBefore = blogs.map((blog) => blog.slug);
    const first = getAllPublishedBlogs();
    const second = getAllPublishedBlogs();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
    for (const blog of first) {
      expect(blog).toBe(getBlogBySlug(blog.slug));
    }

    expect(blogs.map((blog) => blog.slug)).toEqual(datasetOrderBefore);
  });
});

describe("getRecentPublishedBlogs", () => {
  it("defaults to the three newest published posts", () => {
    expect(getRecentPublishedBlogs().map((blog) => blog.slug)).toEqual(
      PUBLISHED_ORDER.slice(0, 3),
    );
    expect(getRecentPublishedBlogs(2, 3)).toEqual(getRecentPublishedBlogs());
  });

  it("stays a prefix — and a strict subset — of the full published listing", () => {
    const published = getAllPublishedBlogs();
    const preview = getRecentPublishedBlogs(2, 3);

    expect(preview.length).toBeLessThan(published.length);
    expect(published.slice(0, preview.length)).toEqual(preview);
  });

  it("never includes a draft", () => {
    expect(
      getRecentPublishedBlogs(2, blogs.length + 5).some((blog) => blog.draft),
    ).toBe(false);
  });

  it("returns the short list rather than [] when fewer than `min` exist", () => {
    // `max` caps the window, so this is the same shape the component sees when
    // the dataset itself is short: one post, below the threshold of 2.
    expect(getRecentPublishedBlogs(2, 1)).toHaveLength(1);
    expect(getRecentPublishedBlogs(5, 3)).toHaveLength(3);
  });

  it("clamps nonsense bounds instead of throwing", () => {
    const threeNewest = PUBLISHED_ORDER.slice(0, 3);

    expect(getRecentPublishedBlogs(2, 0)).toEqual([]);
    expect(getRecentPublishedBlogs(2, -4)).toEqual([]);
    expect(getRecentPublishedBlogs(2, 2.9).map((blog) => blog.slug)).toEqual(
      PUBLISHED_ORDER.slice(0, 2),
    );
    expect(
      getRecentPublishedBlogs(2, Number.NaN).map((blog) => blog.slug),
    ).toEqual(threeNewest);
    expect(
      getRecentPublishedBlogs(2, Number.POSITIVE_INFINITY).map(
        (blog) => blog.slug,
      ),
    ).toEqual(threeNewest);
    expect(getRecentPublishedBlogs(-1, 3).map((blog) => blog.slug)).toEqual(
      threeNewest,
    );
  });

  it("caps at the available count when the dataset is smaller than `max`", () => {
    expect(getRecentPublishedBlogs(2, 100)).toEqual(getAllPublishedBlogs());
  });
});

describe("getPrevNextBlog", () => {
  it("reads neighbours positionally out of the published listing", () => {
    const published = getAllPublishedBlogs();

    for (const [index, blog] of published.entries()) {
      const { previous, next } = getPrevNextBlog(blog.slug);

      expect(previous?.slug).toBe(published[index - 1]?.slug);
      expect(next?.slug).toBe(published[index + 1]?.slug);
    }
  });

  it("treats `previous` as the newer post and `next` as the older one", () => {
    const { previous, next } = getPrevNextBlog(PUBLISHED_ORDER[1]!);

    expect(previous?.slug).toBe(PUBLISHED_ORDER[0]);
    expect(next?.slug).toBe(PUBLISHED_ORDER[2]);
    expect(previous!.publishedDate > next!.publishedDate).toBe(true);
  });

  it("has no previous at the newest post and no next at the oldest", () => {
    expect(getPrevNextBlog(PUBLISHED_ORDER[0]!).previous).toBeUndefined();
    expect(
      getPrevNextBlog(PUBLISHED_ORDER[PUBLISHED_ORDER.length - 1]!).next,
    ).toBeUndefined();
  });

  it("returns canonical records, not clones", () => {
    const { previous, next } = getPrevNextBlog(PUBLISHED_ORDER[1]!);

    expect(previous).toBe(getBlogBySlug(PUBLISHED_ORDER[0]!));
    expect(next).toBe(getBlogBySlug(PUBLISHED_ORDER[2]!));
  });

  it("yields no neighbours for a draft slug or a missing slug", () => {
    const draft = blogs.find((blog) => blog.draft)!;
    const none = { previous: undefined, next: undefined };

    expect(getPrevNextBlog(draft.slug)).toEqual(none);
    expect(getPrevNextBlog("no-such-post")).toEqual(none);
    expect(getPrevNextBlog("")).toEqual(none);

    // ...without conflating them: the lookup the page uses still tells them
    // apart (Property 17).
    expect(getBlogBySlug(draft.slug)).toBeDefined();
    expect(getBlogBySlug("no-such-post")).toBeUndefined();
  });

  it("never returns a draft as a neighbour", () => {
    for (const blog of blogs) {
      const { previous, next } = getPrevNextBlog(blog.slug);

      expect(previous?.draft ?? false).toBe(false);
      expect(next?.draft ?? false).toBe(false);
    }
  });
});

describe("getFeaturedCertifications", () => {
  it("defaults to the newest featured certifications, capped at 3", () => {
    expect(getFeaturedCertifications().map((entry) => entry.id)).toEqual([
      "udemy-complete-web-development-course",
      "100xdevs-cohort-3",
      "udemy-python-bootcamp",
    ]);
    expect(getFeaturedCertifications(3)).toEqual(getFeaturedCertifications());
  });

  it("excludes non-featured entries while any featured entry exists", () => {
    const preview = getFeaturedCertifications(certifications.length);

    expect(preview.every((entry) => entry.featured)).toBe(true);
    expect(preview).toHaveLength(
      certifications.filter((entry) => entry.featured).length,
    );
  });

  it("orders by issueDate descending, newest first", () => {
    const preview = getFeaturedCertifications();

    for (let index = 1; index < preview.length; index += 1) {
      expect(
        preview[index - 1]!.issueDate >= preview[index]!.issueDate,
      ).toBe(true);
    }
  });

  it("renders the same set on the full listing, since the dataset has no non-featured entries", () => {
    const preview = getFeaturedCertifications();

    expect(preview.length).toBe(getAllCertifications().length);
    for (const entry of preview) {
      expect(certifications).toContain(entry);
    }
  });

  it("never repeats an entry", () => {
    const ids = getFeaturedCertifications(certifications.length + 5).map(
      (entry) => entry.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("clamps a nonsense cap instead of throwing", () => {
    const allFeatured = getFeaturedCertifications(certifications.length).map(
      (entry) => entry.id,
    );

    expect(getFeaturedCertifications(0)).toEqual([]);
    expect(getFeaturedCertifications(-4)).toEqual([]);
    expect(getFeaturedCertifications(2.9)).toHaveLength(2);
    expect(getFeaturedCertifications(Number.NaN).map((e) => e.id)).toEqual(
      allFeatured.slice(0, 3),
    );
    expect(
      getFeaturedCertifications(Number.POSITIVE_INFINITY).map((e) => e.id),
    ).toEqual(allFeatured);
  });

  it("returns a fresh array of canonical records and never sorts the dataset", () => {
    const datasetOrderBefore = certifications.map((entry) => entry.id);
    const first = getFeaturedCertifications();
    const second = getFeaturedCertifications();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
    for (const entry of first) {
      expect(certifications).toContain(entry);
    }

    expect(certifications.map((entry) => entry.id)).toEqual(datasetOrderBefore);
  });
});

const HACKATHON_RECENCY_ORDER = [
  "openbench-ml-marathon-2025",
  "orbit-ai-jam-2024",
  "nova-global-hack-2024",
  "civic-code-sprint-2023",
  "chainforge-web3-hack-2023",
  "terminal-velocity-devfest-2022",
  "cloudscape-summer-hack-2022",
  "pixelpush-game-jam-2021",
];

describe("getHackathonsPreview", () => {
  it("defaults to the three most recent hackathons", () => {
    expect(getHackathonsPreview().map((entry) => entry.id)).toEqual(
      HACKATHON_RECENCY_ORDER.slice(0, 3),
    );
    expect(getHackathonsPreview(3)).toEqual(getHackathonsPreview());
  });

  it("orders by date descending, not by position in the data file", () => {
    expect(getHackathonsPreview(hackathons.length).map((e) => e.id)).toEqual(
      HACKATHON_RECENCY_ORDER,
    );
    expect(hackathons[0]!.id).not.toBe(HACKATHON_RECENCY_ORDER[0]);
  });

  it("stays a strict subset of the full hackathons listing", () => {
    const preview = getHackathonsPreview();

    expect(preview.length).toBeLessThan(getAllHackathons().length);
    for (const entry of preview) {
      expect(hackathons).toContain(entry);
    }
  });

  it("does not filter out entries that lack an achievement", () => {
    const withoutAchievement = hackathons.filter(
      (entry) => entry.achievement === undefined,
    );
    const all = getHackathonsPreview(hackathons.length);

    expect(withoutAchievement).toHaveLength(2);
    expect(all).toHaveLength(hackathons.length);
    for (const entry of withoutAchievement) {
      expect(all).toContain(entry);
    }
  });

  it("caps at the dataset size and never repeats an entry", () => {
    const ids = getHackathonsPreview(hackathons.length + 5).map((e) => e.id);

    expect(ids).toHaveLength(hackathons.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("clamps a nonsense cap instead of throwing", () => {
    const threeNewest = HACKATHON_RECENCY_ORDER.slice(0, 3);

    expect(getHackathonsPreview(0)).toEqual([]);
    expect(getHackathonsPreview(-4)).toEqual([]);
    expect(getHackathonsPreview(2.9)).toHaveLength(2);
    expect(getHackathonsPreview(Number.NaN).map((e) => e.id)).toEqual(
      threeNewest,
    );
    expect(
      getHackathonsPreview(Number.POSITIVE_INFINITY).map((e) => e.id),
    ).toEqual(threeNewest);
  });

  it("returns a fresh array of canonical records and never sorts the dataset", () => {
    const datasetOrderBefore = hackathons.map((entry) => entry.id);
    const first = getHackathonsPreview();
    const second = getHackathonsPreview();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
    expect(hackathons.map((entry) => entry.id)).toEqual(datasetOrderBefore);
  });
});

describe("getEducationSortedByDate", () => {
  it("orders every entry by startDate descending", () => {
    expect(getEducationSortedByDate().map((entry) => entry.id)).toEqual(
      [...education]
        .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
        .map((entry) => entry.id),
    );
  });

  it("is non-increasing by startDate", () => {
    const sorted = getEducationSortedByDate();

    for (let index = 1; index < sorted.length; index += 1) {
      expect(sorted[index - 1]!.startDate >= sorted[index]!.startDate).toBe(
        true,
      );
    }
  });

  it("includes the ongoing entry, placed by startDate rather than pinned", () => {
    const sorted = getEducationSortedByDate();
    const ongoing = education.find((entry) => entry.endDate === undefined)!;
    const newestStart = [...education].sort((a, b) =>
      a.startDate < b.startDate ? 1 : -1,
    )[0]!;

    expect(sorted).toContain(ongoing);
    expect(sorted[0]).toBe(newestStart);
    expect(newestStart).toBe(ongoing);
  });

  it("caps nothing — the result length equals the dataset size", () => {
    expect(getEducationSortedByDate()).toHaveLength(education.length);
    expect(getEducationSortedByDate()).toHaveLength(getAllEducation().length);
  });

  it("returns a fresh array of canonical records and never sorts the dataset", () => {
    const datasetOrderBefore = education.map((entry) => entry.id);
    const first = getEducationSortedByDate();
    const second = getEducationSortedByDate();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
    for (const entry of first) {
      expect(education).toContain(entry);
    }

    expect(education.map((entry) => entry.id)).toEqual(datasetOrderBefore);
  });
});

describe("getSiteConfig", () => {
  it("returns the canonical site config record (Requirements 4.2, 4.15)", () => {
    expect(getSiteConfig()).toBe(site);
    expect(getSiteConfig()).toBe(getSiteConfig());
  });

  it("exposes the identity and default SEO fields the root layout's metadata reads", () => {
    const config = getSiteConfig();

    expect(config.siteName).not.toBe("");
    expect(config.defaultSeo.title).not.toBe("");
    expect(config.defaultSeo.description).not.toBe("");
    // `app/layout.tsx` builds `metadataBase` as `new URL(site.domain)`, which
    // throws on a relative value, and URLs elsewhere are built as
    // `${domain}${path}` — so an absolute origin with no trailing slash.
    expect(() => new URL(config.domain)).not.toThrow();
    expect(config.domain.endsWith("/")).toBe(false);
  });
});
