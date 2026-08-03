import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlatformCard } from "@/components/competitive-programming/PlatformCard";
import type { CompetitiveProgrammingPlatform } from "@/types";

const withRank: CompetitiveProgrammingPlatform = {
  id: "cp-leetcode",
  platform: "LeetCode",
  username: "johndoe",
  profileUrl: "https://leetcode.com/u/johndoe/",
  rating: 2148,
  solved: 842,
  rank: "Guardian",
  badges: ["100 Days Badge 2024"],
  logo: "/images/competitive-programming/leetcode.svg",
};

const withoutRank: CompetitiveProgrammingPlatform = {
  ...withRank,
  id: "cp-codeforces-no-rank",
  platform: "Codeforces",
  rank: undefined,
};

describe("PlatformCard", () => {
  it("renders the platform name, logo, rating, and solved count", () => {
    render(<PlatformCard platform={withRank} />);

    expect(
      screen.getByRole("heading", { name: withRank.platform }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: `${withRank.platform} logo` }),
    ).toBeInTheDocument();
    expect(screen.getByText(String(withRank.rating))).toBeInTheDocument();
    expect(screen.getByText(String(withRank.solved))).toBeInTheDocument();
  });

  it("renders the rank when present", () => {
    render(<PlatformCard platform={withRank} />);

    expect(screen.getByText(withRank.rank as string)).toBeInTheDocument();
  });

  it("omits the rank row entirely when rank is undefined", () => {
    render(<PlatformCard platform={withoutRank} />);

    expect(screen.queryByText("Rank")).not.toBeInTheDocument();
  });

  it("renders an external profile link with a one-word visible label and a descriptive accessible name", () => {
    render(<PlatformCard platform={withRank} />);

    // Item 7: visible link text shrinks to one word ("Profile"); the fuller
    // descriptive text moves to `aria-label` for accessibility.
    const link = screen.getByRole("link", {
      name: `View ${withRank.username}'s ${withRank.platform} profile`,
    });
    expect(link).toHaveTextContent("Profile");
    expect(link).toHaveAttribute("href", withRank.profileUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
