import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HackathonCard } from "@/components/hackathons/HackathonCard";
import type { Hackathon } from "@/types";

const withAchievement: Hackathon = {
  id: "sample-hackathon",
  slug: "sample-hackathon",
  name: "HackTheNorth",
  organizer: "University of Waterloo",
  description: "A weekend hackathon focused on rapid prototyping.",
  date: "2023-10-14",
  location: "Waterloo, ON",
  achievement: "1st Place Overall",
  teamMembers: ["Alex Doe", "Sam Lee"],
  technologies: ["react", "nodejs"],
  images: ["/images/hackathons/sample-hackathon-1.jpg"],
  demo: "https://example.com/demo",
  github: "https://github.com/example/sample-hackathon",
};

const withoutAchievement: Hackathon = {
  ...withAchievement,
  id: "sample-hackathon-no-achievement",
  name: "LocalHacks",
  achievement: undefined,
};

describe("HackathonCard", () => {
  it("renders the name, organizer, date, and achievement", () => {
    render(<HackathonCard hackathon={withAchievement} />);

    expect(
      screen.getByRole("heading", { name: withAchievement.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(withAchievement.organizer)).toBeInTheDocument();
    expect(screen.getByText("Oct 14, 2023")).toBeInTheDocument();
    expect(
      screen.getByText(withAchievement.achievement as string),
    ).toBeInTheDocument();
  });

  it("uses a real <time> element with a matching dateTime attribute", () => {
    render(<HackathonCard hackathon={withAchievement} />);

    const time = screen.getByText("Oct 14, 2023");
    expect(time.tagName.toLowerCase()).toBe("time");
    expect(time).toHaveAttribute("dateTime", withAchievement.date);
  });

  it("omits the achievement entirely when none is available", () => {
    render(<HackathonCard hackathon={withoutAchievement} />);

    expect(
      screen.getByRole("heading", { name: withoutAchievement.name }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(withAchievement.achievement as string),
    ).not.toBeInTheDocument();
  });
});
