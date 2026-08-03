import { readFile } from "node:fs/promises";
import path from "node:path";
import { compile } from "@tailwindcss/node";
import { beforeAll, describe, expect, it } from "vitest";

import tailwindConfig from "@/tailwind.config";

/**
 * Compiled-CSS contract for the design tokens.
 *
 * Every other test in this repo asserts on the DOM or on generated *class
 * strings*. A class string can be perfectly correct and still compile to a
 * declaration that does nothing, which is exactly how two token-plumbing
 * defects survived review: the classes read fine, only the compiled CSS was
 * wrong. So this file runs the real Tailwind compiler over
 * `styles/globals.css` — the same stylesheet, the same `@config`, the same
 * version the app builds with — and asserts on the emitted declarations.
 *
 * Two properties are locked down here.
 *
 * 1. **Alpha modifiers composite.** `bg-primary/90` must emit
 *    `color-mix(in oklab, var(--primary) 90%, transparent)`. Tailwind v4 also
 *    emits the bare `var(--primary)` ahead of it as the fallback for browsers
 *    without `color-mix()`; reading only that first line is what made the
 *    modifier look "silently dropped" and pushed components onto
 *    `hover:opacity-*` workarounds. Both lines are asserted, for every colour
 *    token in the config, so neither half can disappear unnoticed.
 *
 * 2. **No token name collides with a Tailwind theme variable.** When Tailwind
 *    inlines the pre-`color-mix()` fallback it resolves `var(--x)` references
 *    inside theme values against *its own* theme. A token named `--shadow` —
 *    Tailwind's built-in default box-shadow variable — therefore had a shadow
 *    list substituted into a colour slot, invalidating the declaration. The
 *    per-token fallback assertion above is the general guard against that
 *    whole class of bug: a colliding name cannot produce a clean
 *    `var(--token)` fallback. `describe("negative control")` proves the guard
 *    can actually fail.
 *
 * `@tailwindcss/node` is pinned to the exact version of `tailwindcss` the app
 * uses, so this file tests the compiler that ships, not a different one.
 */

const STYLES_DIR = import.meta.dirname;
const GLOBALS_CSS = path.join(STYLES_DIR, "globals.css");

/** Escapes a candidate into the class selector Tailwind emits for it. */
function selectorFor(candidate: string): string {
  return `.${candidate.replace(/[:/[\]().%]/g, (character) => `\\${character}`)}`;
}

/**
 * Everything Tailwind emitted for `candidate`, as one string.
 *
 * A single candidate can produce more than one rule: the `color-mix()` value is
 * wrapped in `@supports`, which Tailwind nests inside the rule for a plain
 * utility but hoists to a sibling rule for a variant like `hover:` (whose own
 * `@media (hover: hover)` wrapper it has to stay inside). Collecting every rule
 * with the selector — brace-matched, so nested at-rules come along — makes the
 * assertions independent of which shape Tailwind picks.
 */
function ruleBody(css: string, candidate: string): string {
  const selector = selectorFor(candidate);
  // The lookahead stops `.bg-primary` from matching inside `.bg-primary\/90`.
  const occurrences = new RegExp(
    `${selector.replace(/[.\\+*?[^\]$(){}=!<>|:/-]/g, "\\$&")}(?=[\\s,{:])`,
    "g",
  );
  const bodies: string[] = [];

  for (const match of css.matchAll(occurrences)) {
    const open = css.indexOf("{", match.index);
    let depth = 0;

    for (let index = open; index < css.length; index++) {
      if (css[index] === "{") depth += 1;
      else if (css[index] === "}") {
        depth -= 1;
        if (depth === 0) {
          bodies.push(css.slice(open + 1, index));
          break;
        }
      }
    }
  }

  expect(
    bodies.length,
    `Tailwind emitted no rule for \`${candidate}\``,
  ).toBeGreaterThan(0);

  return bodies.join("\n");
}

/** Returns the body of a top-level rule with the given literal selector. */
function blockFor(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, `no \`${selector}\` block in the compiled CSS`).toBeGreaterThan(
    -1,
  );
  return css.slice(start, css.indexOf("}", start));
}

type ColorToken = {
  /** Utility fragment, e.g. `primary` or `primary-foreground`. */
  utility: string;
  /** CSS custom property the mapping points at, e.g. `--primary`. */
  token: string;
};

/**
 * Flattens `theme.extend.colors` into the utility fragments Tailwind derives
 * from it, paired with the custom property each one resolves through. Reading
 * the config rather than restating it means a token added later is covered by
 * these assertions automatically.
 */
function colorTokens(value: unknown, trail: string[] = []): ColorToken[] {
  if (typeof value === "string") {
    const token = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
    expect(
      token,
      `colour \`${trail.join(".")}\` is not a plain \`var(--token)\` mapping`,
    ).toBeDefined();

    const utility = trail.filter((part) => part !== "DEFAULT").join("-");
    return [{ utility, token: token as string }];
  }

  if (value === null || typeof value !== "object") return [];

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => colorTokens(child, [...trail, key]),
  );
}

const COLOR_TOKENS = colorTokens(tailwindConfig.theme?.extend?.colors);

/** Alpha percentage used for the per-token compositing assertions. */
const PROBE_ALPHA = 50;

const CANDIDATES = [
  ...COLOR_TOKENS.map(({ utility }) => `bg-${utility}/${PROBE_ALPHA}`),
  // The exact utilities the design-system components rely on.
  "hover:bg-primary/90",
  "hover:bg-secondary/80",
  "border-destructive/40",
  "bg-destructive/10",
  "shadow-elevation",
  // Preserved from task 12: the type scale and the font families.
  "text-h1",
  "text-caption",
  "font-sans",
  "font-mono",
  "rounded-md",
  // `darkMode: "class"` must stay honoured — next-themes sets a class.
  "dark:bg-background",
];

let css = "";

beforeAll(async () => {
  const source = await readFile(GLOBALS_CSS, "utf8");
  const compiler = await compile(source, {
    base: STYLES_DIR,
    from: GLOBALS_CSS,
    onDependency: () => {},
  });

  css = compiler.build(CANDIDATES);
}, 120_000);

describe("colour tokens composite under an alpha modifier", () => {
  it("covers every colour mapped in the Tailwind config", () => {
    // Guards against the suite silently testing nothing if the config moves.
    expect(COLOR_TOKENS.length).toBeGreaterThanOrEqual(20);
    expect(COLOR_TOKENS.map((entry) => entry.utility)).toContain("primary");
    expect(COLOR_TOKENS.map((entry) => entry.utility)).toContain("destructive");
  });

  it.each(COLOR_TOKENS)(
    "emits a composited colour for bg-$utility/50",
    ({ utility, token }) => {
      const body = ruleBody(css, `bg-${utility}/${PROBE_ALPHA}`);

      // The modifier is honoured, not discarded.
      expect(body).toContain(
        `background-color: color-mix(in oklab, var(${token}) ${PROBE_ALPHA}%, transparent);`,
      );
      // And the pre-`color-mix()` fallback is the bare token, not a value
      // borrowed from a same-named Tailwind theme variable.
      expect(body).toContain(`background-color: var(${token});`);
    },
  );

  it("composites the exact hover tints the design-system Button uses", () => {
    expect(ruleBody(css, "hover:bg-primary/90")).toContain(
      "background-color: color-mix(in oklab, var(--primary) 90%, transparent);",
    );
    expect(ruleBody(css, "hover:bg-secondary/80")).toContain(
      "background-color: color-mix(in oklab, var(--secondary) 80%, transparent);",
    );
  });

  it("composites the tinted destructive surfaces ErrorState uses", () => {
    expect(ruleBody(css, "border-destructive/40")).toContain(
      "border-color: color-mix(in oklab, var(--destructive) 40%, transparent);",
    );
    expect(ruleBody(css, "bg-destructive/10")).toContain(
      "background-color: color-mix(in oklab, var(--destructive) 10%, transparent);",
    );
  });
});

describe("the elevation token compiles to a valid shadow", () => {
  it("emits a real box-shadow tinted by --elevation", () => {
    const body = ruleBody(css, "shadow-elevation");

    expect(body).toContain(
      "--tw-shadow: 0 4px 10px -2px var(--tw-shadow-color, var(--elevation));",
    );
    expect(body).toContain("box-shadow:");
  });

  it("borrows nothing from Tailwind's built-in --shadow variable", () => {
    const body = ruleBody(css, "shadow-elevation");

    // `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` is the
    // value of Tailwind's own `--shadow`. Seeing any of it here would mean the
    // name collision is back.
    expect(body).not.toContain("rgb(0 0 0 / 0.1)");
    expect(body).not.toContain("1px 2px -1px");
    // The old broken form set a shadow *colour* from a shadow *value*.
    expect(body).not.toContain("--tw-shadow-color:");
  });

  it("no longer exposes a colliding `shadow` colour utility", () => {
    expect(css).not.toContain(".shadow-shadow");
  });
});

/**
 * Every custom property the config reads from a colour or box-shadow value.
 *
 * `theme.extend.borderRadius` is deliberately out of scope. It also references
 * a token Tailwind happens to own (`--radius`), but a length slot is passed
 * through verbatim rather than resolved against Tailwind's theme, so no
 * substitution can occur there — asserted directly by the `rounded-md` case
 * further down. Colour slots are the ones that resolve, and therefore the ones
 * that need guarding.
 */
const TINT_TOKENS = [
  ...new Set([
    ...COLOR_TOKENS.map(({ token }) => token),
    ...tokensIn(tailwindConfig.theme?.extend?.boxShadow),
  ]),
].sort();

/** Collects the `var(--x)` names appearing anywhere inside a theme value. */
function tokensIn(value: unknown, found = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    for (const match of value.matchAll(/var\((--[\w-]+)/g)) found.add(match[1]);
  } else if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      tokensIn(child, found);
    }
  }
  return found;
}

describe("no design token reuses a Tailwind theme variable name", () => {
  /**
   * Probes every token through a colour slot, which is where Tailwind resolves
   * `var()` references against its own theme when it inlines the
   * pre-`color-mix()` fallback. A token whose name Tailwind already owns gets
   * that value substituted instead, producing a nonsense declaration — the
   * root cause of the old `shadow-shadow`. Driving the probe off the config
   * means a token added later is covered without touching this test.
   */
  let probeCss = "";

  beforeAll(async () => {
    const probe = await compile(
      [
        '@import "tailwindcss";',
        "@theme inline {",
        ...TINT_TOKENS.map(
          (token, index) => `  --color-probe-${index}: var(${token});`,
        ),
        // Negative control: the name the defect was caused by.
        "  --color-control: var(--shadow);",
        "}",
      ].join("\n"),
      {
        base: STYLES_DIR,
        from: path.join(STYLES_DIR, "collision-probe.css"),
        onDependency: () => {},
      },
    );

    probeCss = probe.build([
      ...TINT_TOKENS.map((_, index) => `bg-probe-${index}/${PROBE_ALPHA}`),
      `bg-control/${PROBE_ALPHA}`,
    ]);
  }, 120_000);

  it("covers the elevation tint alongside the colours", () => {
    expect(TINT_TOKENS).toContain("--elevation");
    expect(TINT_TOKENS).not.toContain("--shadow");
  });

  it.each(TINT_TOKENS.map((token, index) => ({ token, index })))(
    "resolves $token cleanly in a colour slot",
    ({ token, index }) => {
      expect(ruleBody(probeCss, `bg-probe-${index}/${PROBE_ALPHA}`)).toContain(
        `background-color: var(${token});`,
      );
    },
  );

  it("negative control: --shadow does not resolve cleanly", () => {
    // Proves the assertion above can fail. `--shadow` is Tailwind's built-in
    // default box-shadow variable, so its shadow list lands in the colour slot.
    const body = ruleBody(probeCss, `bg-control/${PROBE_ALPHA}`);

    expect(body).not.toContain("background-color: var(--shadow);");
    expect(body).toContain("1px 2px -1px");
  });
});

describe("both theme token blocks still emit", () => {
  it("applies the dark palette with no class and under .dark", () => {
    const dark = blockFor(css, ":root, .dark");

    expect(dark).toContain("color-scheme: dark;");
    expect(dark).toContain("--background: #0a0a0a;");
    expect(dark).toContain("--foreground: #ededed;");
    expect(dark).toContain("--primary: #ededed;");
    expect(dark).toContain("--elevation: rgb(0 0 0 / 0.65);");
  });

  it("overrides them under .light", () => {
    const light = blockFor(css, ".light");

    expect(light).toContain("color-scheme: light;");
    expect(light).toContain("--background: #ffffff;");
    expect(light).toContain("--foreground: #171717;");
    expect(light).toContain("--primary: #171717;");
    expect(light).toContain("--elevation: rgb(0 0 0 / 0.1);");
  });

  it("orders .light after the dark block so the class wins", () => {
    // Identical specificity, so source order decides. Dark stays the default
    // because it needs no class at all (Requirement 3.2, 3.4).
    expect(css.indexOf(".light {")).toBeGreaterThan(
      css.indexOf(":root, .dark"),
    );
  });

  it("declares every colour token the config maps, in both blocks", () => {
    const dark = blockFor(css, ":root, .dark");
    const light = blockFor(css, ".light");

    for (const { token } of COLOR_TOKENS) {
      expect(dark, `${token} missing from the dark block`).toContain(
        `${token}:`,
      );
      expect(light, `${token} missing from the light block`).toContain(
        `${token}:`,
      );
    }
  });
});

describe("the typography scale and dark variant survive config edits", () => {
  it("keeps the clamped heading and caption tokens from task 12", () => {
    expect(ruleBody(css, "text-h1")).toContain(
      "font-size: clamp(3rem, 2.25rem + 2.5vw, 4rem);",
    );
    expect(ruleBody(css, "text-caption")).toContain("font-size: 0.75rem;");
  });

  it("keeps the font families wired to the loader's variables", () => {
    expect(ruleBody(css, "font-sans")).toContain("var(--font-sans)");
    expect(ruleBody(css, "font-mono")).toContain("var(--font-mono)");
  });

  it("derives the radius scale from the single --radius token", () => {
    expect(ruleBody(css, "rounded-md")).toContain(
      "border-radius: var(--radius);",
    );
  });

  it("resolves the dark variant from a class, not prefers-color-scheme", () => {
    // next-themes sets `class` on <html>, so `darkMode: "class"` must hold.
    expect(css).toContain(".dark\\:bg-background:is(.dark *)");
    expect(css).not.toContain("prefers-color-scheme");
  });
});
