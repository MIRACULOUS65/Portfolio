import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HashScrollRestoration } from "./HashScrollRestoration";

/**
 * Requirement 5.9 / design.md "Scroll-to-Section from Dedicated Pages":
 * on mount, reads `window.location.hash` and scrolls the matching section
 * into view after the initial paint (via `requestAnimationFrame`), the same
 * behavior a homepage-native Navbar click produces.
 *
 * jsdom ships no `scrollIntoView`, so each test installs its own spy per
 * section, mirroring the environment shim `Navbar.test.tsx` uses for the same
 * reason.
 */
describe("<HashScrollRestoration />", () => {
  let reduceMotion = false;

  beforeEach(() => {
    reduceMotion = false;

    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: reduceMotion,
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.querySelectorAll("section").forEach((section) => {
      section.remove();
    });
    window.location.hash = "";
  });

  function appendSection(id: string): ReturnType<typeof vi.fn> {
    const section = document.createElement("section");
    section.id = id;
    const scrollIntoView = vi.fn<Element["scrollIntoView"]>();
    section.scrollIntoView =
      scrollIntoView as unknown as Element["scrollIntoView"];
    document.body.append(section);

    return scrollIntoView;
  }

  it("scrolls the section matching window.location.hash after mount", async () => {
    const scrollIntoView = appendSection("projects");
    window.location.hash = "#projects";

    render(<HashScrollRestoration />);

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  it("degrades to an instant jump under prefers-reduced-motion (Requirement 24.5)", async () => {
    reduceMotion = true;
    const scrollIntoView = appendSection("contact");
    window.location.hash = "#contact";

    render(<HashScrollRestoration />);

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "auto",
        block: "start",
      });
    });
  });

  it("does nothing when there is no hash", async () => {
    const scrollIntoView = appendSection("hero");
    window.location.hash = "";

    render(<HashScrollRestoration />);

    // No section to assert a call happened on, so give the effect and its
    // deferred frame a chance to run, then confirm nothing was scrolled.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when the hash matches no section", async () => {
    const scrollIntoView = appendSection("hero");
    window.location.hash = "#does-not-exist";

    render(<HashScrollRestoration />);

    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("renders no visible output", () => {
    window.location.hash = "";
    const { container } = render(<HashScrollRestoration />);

    expect(container).toBeEmptyDOMElement();
  });
});
