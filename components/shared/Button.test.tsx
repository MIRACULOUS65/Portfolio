import { render, screen } from "@testing-library/react";
import { Download } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  Button,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/shared/Button";

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "link",
];
const SIZES: ButtonSize[] = ["sm", "md", "lg", "icon"];

describe("Button", () => {
  it("renders a non-submitting button labelled by its children", () => {
    render(<Button>Download résumé</Button>);

    const button = screen.getByRole("button", { name: "Download résumé" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toBeEnabled();
  });

  it("defaults to the primary variant at the medium size", () => {
    render(<Button>Contact</Button>);

    const button = screen.getByRole("button", { name: "Contact" });
    expect(button.dataset.slot).toBe("button");
    expect(button.dataset.variant).toBe("primary");
    expect(button.dataset.size).toBe("md");
    expect(button.className).toContain("bg-primary");
    // Hover tints the token's own background. That the `/nn` modifier really
    // composites is asserted against a Tailwind compile in
    // `styles/globals.test.ts`.
    expect(button.className).toContain("hover:bg-primary/90");
  });

  it("exposes every documented variant through a data attribute", () => {
    for (const variant of VARIANTS) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);

      expect(
        screen.getByRole("button", { name: variant }).dataset.variant,
      ).toBe(variant);
      unmount();
    }
  });

  it("strips the box treatment from the link variant", () => {
    render(<Button variant="link">Read more</Button>);

    const button = screen.getByRole("button", { name: "Read more" });
    // The size's height/padding is reset, so a link reads as text, not a box.
    expect(button.className).toContain("px-0");
    expect(button.className).not.toContain("px-5");
    expect(button.className).not.toContain("h-11");
  });

  it("marks the loading state busy, disables it, and shows a spinner", () => {
    const { container } = render(<Button loading>Send message</Button>);

    const button = screen.getByRole("button", { name: "Send message" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.dataset.loading).toBe("true");
    // Spinner is decorative, so the caller's label stays the accessible name.
    const spinner = container.querySelector("svg");
    expect(spinner).toHaveAttribute("aria-hidden", "true");
    expect(spinner?.getAttribute("class")).toContain("animate-spin");
  });

  it("sets neither aria-busy nor the loading flag when idle", () => {
    render(<Button>Idle</Button>);

    const button = screen.getByRole("button", { name: "Idle" });
    expect(button).not.toHaveAttribute("aria-busy");
    expect(button.dataset.loading).toBeUndefined();
  });

  it("swaps an icon-only button's icon for the spinner instead of adding one", () => {
    const { container } = render(
      <Button size="icon" loading aria-label="Copy link">
        <Download />
      </Button>,
    );

    // One glyph, not two: the square footprint cannot change (Requirement 24.4).
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Copy link" }),
    ).toBeInTheDocument();
  });

  it("keeps an icon-only button's accessible name from aria-label", () => {
    render(
      <Button size="icon" aria-label="Open menu">
        <Download />
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Open menu" })).toBeEnabled();
  });

  it("honours an explicitly disabled button", () => {
    render(<Button disabled>Unavailable</Button>);

    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });

  it("lets caller utilities override the defaults", () => {
    render(<Button className="h-9 w-full">Wide</Button>);

    const button = screen.getByRole("button", { name: "Wide" });
    expect(button.className).toContain("h-9");
    expect(button.className).not.toContain("h-11");
  });
});

// Local invariant guarding Requirement 24.4 at this component's boundary. The
// spec-level check across all animated components is Property 21 (task 15.12);
// this keeps the guarantee close to the class strings that have to hold it.
describe("buttonVariants transform safety", () => {
  // `translate`/`scale` are the standalone properties Tailwind v4 emits for
  // transform utilities — still compositor-only, never layout.
  const ALLOWED_TRANSITION_PROPERTIES = [
    "transform",
    "translate",
    "scale",
    "opacity",
    "color",
    "background-color",
    "border-color",
  ];

  const LAYOUT_TRIGGERING_STATE = new RegExp(
    "(?:hover|active|focus|focus-visible|focus-within|disabled):" +
      "(?:w|h|size|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|top|right|bottom|left|inset|shadow)-",
  );

  it("never animates a layout-triggering property or box-shadow", () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        const classes = buttonVariants({ variant, size });

        expect(classes).not.toContain("transition-all");
        expect(classes).not.toMatch(LAYOUT_TRIGGERING_STATE);

        const transition = /transition-\[([^\]]+)\]/.exec(classes);
        expect(transition).not.toBeNull();
        for (const property of transition![1].split(",")) {
          expect(ALLOWED_TRANSITION_PROPERTIES).toContain(property.trim());
        }
      }
    }
  });

  it("expresses press feedback as a transform and disabled state as opacity", () => {
    const classes = buttonVariants({ variant: "primary", size: "md" });

    expect(classes).toContain("active:scale-[0.98]");
    expect(classes).toContain("disabled:opacity-50");
    expect(classes).toContain("motion-reduce:active:scale-100");
  });
});
