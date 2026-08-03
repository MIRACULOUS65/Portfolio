import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar } from "@/components/hero/Avatar";
import { getProfile } from "@/lib/data-access";

describe("Avatar", () => {
  it("renders the profile photo sourced from the Profile dataset", () => {
    render(<Avatar />);

    const { avatar, name } = getProfile();

    const image = screen.getByRole("img", {
      name: `${name}'s profile photo`,
    });
    // `next/image` rewrites `src` through its optimizer, so the original
    // dataset path is encoded within it rather than equal to it.
    expect(image.getAttribute("src")).toContain(encodeURIComponent(avatar));
  });

  it("never hardcodes the photo: it tracks the Profile dataset", () => {
    const { container } = render(<Avatar />);

    const image = container.querySelector("img");
    const { avatar } = getProfile();

    expect(image?.getAttribute("src")).toContain(encodeURIComponent(avatar));
  });

  it("lets caller utilities override the wrapper defaults", () => {
    const { container } = render(<Avatar className="h-20 w-20" />);

    const wrapper = container.querySelector<HTMLElement>(
      "[data-slot='avatar']",
    );
    expect(wrapper?.className).toContain("h-20");
    expect(wrapper?.className).toContain("w-20");
  });
});
