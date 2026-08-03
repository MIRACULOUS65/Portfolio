import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RecommendationPage from "./page";

/**
 * Smoke test for the dedicated Recommendations route (item I).
 */
describe("<RecommendationPage />", () => {
  it("renders the heading, coming-soon text, and a link back home", () => {
    render(<RecommendationPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Recommendations" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /back home/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
