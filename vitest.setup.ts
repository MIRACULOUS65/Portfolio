import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Every test starts from an empty document, including property tests that
// render many times inside a single `it` block.
afterEach(() => {
  cleanup();
});
