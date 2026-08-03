import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  cardVariants,
  type CardVariant,
} from "@/components/shared/Card";

const VARIANTS: CardVariant[] = ["elevated", "flat", "interactive"];

describe("Card", () => {
  it("renders its children on an elevated surface by default", () => {
    const { container } = render(<Card>Project summary</Card>);

    const card = container.querySelector<HTMLElement>("[data-slot='card']");
    expect(card?.textContent).toBe("Project summary");
    expect(card?.dataset.variant).toBe("elevated");
    expect(card?.className).toContain("bg-card");
    // Elevation comes from the theme token, never a hardcoded colour. That
    // `shadow-elevation` compiles to a valid declaration — the thing the old
    // `shadow-shadow` name broke — is asserted in `styles/globals.test.ts`.
    expect(card?.className).toContain("shadow-elevation");
  });

  it("drops the shadow for the flat variant", () => {
    const { container } = render(<Card variant="flat">Flat</Card>);

    const card = container.querySelector<HTMLElement>("[data-slot='card']");
    expect(card?.dataset.variant).toBe("flat");
    expect(card?.className).not.toContain("shadow-");
  });

  it("renders as the requested element so callers own the semantics", () => {
    render(
      <ul>
        <Card as="li">Certification</Card>
      </ul>,
    );

    const item = screen.getByRole("listitem");
    expect(item.dataset.slot).toBe("card");
    expect(item.tagName).toBe("LI");
  });

  it("gives the interactive variant a 2px lift plus border emphasis", () => {
    const { container } = render(<Card variant="interactive">Hover me</Card>);

    const card = container.querySelector<HTMLElement>("[data-slot='card']");
    expect(card?.className).toContain("hover:-translate-y-0.5");
    expect(card?.className).toContain("hover:border-muted-foreground");
    // Keyboard users get the same affordance and a visible focus indicator.
    expect(card?.className).toContain("focus-within:-translate-y-0.5");
    expect(card?.className).toContain("focus-within:outline-ring");
  });

  it("cancels the lift under reduced motion", () => {
    const { container } = render(<Card variant="interactive">Reduced</Card>);

    const card = container.querySelector<HTMLElement>("[data-slot='card']");
    expect(card?.className).toContain("motion-reduce:transition-none");
    expect(card?.className).toContain("motion-reduce:hover:translate-y-0");
  });

  it("lets caller utilities override the defaults", () => {
    const { container } = render(<Card className="rounded-sm">Square</Card>);

    const card = container.querySelector<HTMLElement>("[data-slot='card']");
    expect(card?.className).toContain("rounded-sm");
    expect(card?.className).not.toContain("rounded-lg");
  });

  it("composes header, content, and footer without re-adding padding", () => {
    const { container } = render(
      <Card as="article">
        <CardHeader>Title</CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Actions</CardFooter>
      </Card>,
    );

    for (const slot of ["card-header", "card-content", "card-footer"]) {
      const part = container.querySelector<HTMLElement>(
        `[data-slot='${slot}']`,
      );
      expect(part).not.toBeNull();
      // Padding lives on the card, so nesting the parts cannot double it.
      expect(part?.className).not.toMatch(/\bp-\d/);
    }
    expect(container.querySelector("article")).not.toBeNull();
  });
});

// Local invariant guarding Requirement 24.4 at this component's boundary. The
// spec-level check across all animated components is Property 21 (task 15.12);
// this keeps the guarantee close to the class strings that have to hold it.
describe("cardVariants transform safety", () => {
  // `translate` is the standalone property Tailwind v4 emits for
  // `-translate-y-*` — still a compositor-only transform, never layout.
  const ALLOWED_TRANSITION_PROPERTIES = [
    "transform",
    "translate",
    "opacity",
    "border-color",
  ];

  const LAYOUT_TRIGGERING_STATE = new RegExp(
    "(?:hover|active|focus|focus-visible|focus-within|disabled):" +
      "(?:w|h|size|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|top|right|bottom|left|inset|shadow)-",
  );

  it("never animates a layout-triggering property or box-shadow", () => {
    for (const variant of VARIANTS) {
      const classes = cardVariants({ variant });

      expect(classes).not.toContain("transition-all");
      // Notably: no `hover:shadow-*`. Elevation is static per variant because
      // Requirement 24.4 forbids animating box-shadow for any purpose.
      expect(classes).not.toMatch(LAYOUT_TRIGGERING_STATE);

      const transition = /transition-\[([^\]]+)\]/.exec(classes);
      if (transition === null) continue;
      for (const property of transition[1].split(",")) {
        expect(ALLOWED_TRANSITION_PROPERTIES).toContain(property.trim());
      }
    }
  });

  it("only declares a transition on the variant that animates", () => {
    expect(cardVariants({ variant: "interactive" })).toContain("transition-[");
    expect(cardVariants({ variant: "elevated" })).not.toContain("transition-[");
    expect(cardVariants({ variant: "flat" })).not.toContain("transition-[");
  });
});
