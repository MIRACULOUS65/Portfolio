import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Test runner configuration for the whole project.
 *
 * Conventions every test in this repo follows:
 * - Test files are colocated with the unit under test as `*.test.ts` /
 *   `*.test.tsx` (Coding_Standards: "feature-related code stays together").
 *   Next.js never bundles them because nothing in `app/` imports them and they
 *   are not route files.
 * - `jsdom` is the environment, so React components can be rendered with
 *   `@testing-library/react`.
 * - `vitest.setup.ts` registers the jest-dom matchers and unmounts rendered
 *   trees after each test.
 * - The `@/*` alias mirrors `tsconfig.json` `compilerOptions.paths` so imports
 *   in tests read exactly like imports in application code.
 *
 * Timeouts follow a two-tier rule, deliberately:
 *
 * - `testTimeout` stays at the 5s default for every ordinary example test. A
 *   unit test that renders once and asserts on the DOM has no business taking
 *   seconds, so a genuinely hung one should fail fast rather than sit on the
 *   run for half a minute.
 * - The handful of property tests that mount or render inside all 100
 *   fast-check runs pass an explicit longer timeout as `it`'s third argument
 *   (`PROPERTY_TEST_TIMEOUT_MS` in those files). Those tests legitimately do
 *   ~100x the work of an example test — `components/theme/themeResolution.test.tsx`
 *   mounts the real `ThemeProvider` twice per run to prove persistence survives
 *   a reload — so they run ~1-4s on an idle machine and can cross 5s when the
 *   suite's worker pool competes for CPU. Raising the timeout for exactly those
 *   tests removes the flake without loosening anything else and without
 *   reducing `numRuns` or weakening a property.
 * - `hookTimeout` (default 10s) is a separate budget and applies to
 *   `beforeAll`/`afterEach`/etc., not to `it` bodies. `styles/globals.test.ts`
 *   runs the real Tailwind compiler in two `beforeAll` hooks and passes its own
 *   120s hook timeout there; that is the right knob for hook work and is
 *   untouched by the `testTimeout` rule above.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^@\/(.*)$/, replacement: `${import.meta.dirname}/$1` }],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "out/**", "build/**"],
    // Tailwind is compiled by PostCSS for the app only; tests assert on DOM
    // structure and text, never on computed styles.
    css: false,
    restoreMocks: true,
    // Explicit rather than implicit: this is the tight budget for ordinary
    // example tests. Mount/render-heavy property tests opt out per test — see
    // the timeout note in this file's header.
    testTimeout: 5_000,
  },
});
