import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EducationCard } from "@/components/education/EducationCard";
import type { Education } from "@/types";

const ongoing: Education = {
  id: "sample-university",
  institution: "Sample University",
  degree: "B.Sc. in Computer Science",
  specialization: "Machine Learning",
  startDate: "2021-09-01",
  achievements: ["Dean's List", "Best Capstone Project"],
  coursework: ["Data Structures", "Operating Systems"],
  logo: "/images/education/sample-university.svg",
};

const completedNoAchievements: Education = {
  ...ongoing,
  id: "sample-college",
  institution: "Sample College",
  degree: "Higher Secondary Certificate",
  specialization: undefined,
  endDate: "2021-06-30",
  achievements: [],
};

describe("EducationCard", () => {
  it("renders the institution, degree with specialization, and achievements", () => {
    render(<EducationCard education={ongoing} />);

    expect(
      screen.getByRole("heading", { name: ongoing.institution }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${ongoing.degree} — ${ongoing.specialization}`),
    ).toBeInTheDocument();
    expect(screen.getByText("Dean's List")).toBeInTheDocument();
    expect(screen.getByText("Best Capstone Project")).toBeInTheDocument();
  });

  it("renders the start date as an ongoing range when endDate is absent", () => {
    render(<EducationCard education={ongoing} />);

    const startTime = screen.getByText("Sep 2021");
    expect(startTime.tagName.toLowerCase()).toBe("time");
    expect(startTime).toHaveAttribute("dateTime", ongoing.startDate);
    expect(screen.getByText("Present")).toBeInTheDocument();
  });

  it("renders both start and end dates as real <time> elements when endDate is present", () => {
    render(<EducationCard education={completedNoAchievements} />);

    const startTime = screen.getByText("Sep 2021");
    const endTime = screen.getByText("Jun 2021");
    expect(startTime.tagName.toLowerCase()).toBe("time");
    expect(endTime.tagName.toLowerCase()).toBe("time");
    expect(endTime).toHaveAttribute(
      "dateTime",
      completedNoAchievements.endDate,
    );
    expect(screen.queryByText("Present")).not.toBeInTheDocument();
  });

  it("omits the achievements list entirely when there are none", () => {
    render(<EducationCard education={completedNoAchievements} />);

    expect(screen.queryByText("Achievements")).not.toBeInTheDocument();
  });

  it("renders the degree without a specialization suffix when absent", () => {
    render(<EducationCard education={completedNoAchievements} />);

    expect(
      screen.getByText(completedNoAchievements.degree),
    ).toBeInTheDocument();
  });
});
