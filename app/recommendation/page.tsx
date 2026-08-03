import Link from "next/link";

import { Container } from "@/components/shared/Container";

/**
 * The dedicated Recommendations route (item I of the hero/homepage redesign).
 *
 * Previously an inline `<section id="recommendation">` placeholder on the
 * Homepage (`app/page.tsx`); moved to a real route so the Navbar's
 * "Recommendation" link becomes an ordinary page navigation rather than a
 * homepage hash anchor (`data/navigation.ts`, `components/navbar/Navbar.tsx`).
 *
 * Minimal placeholder content for now — an `<h1>`, a muted "Coming soon"
 * paragraph, and a link back home — following this codebase's page
 * convention of relying on `RootLayout` for the Navbar/Footer chrome and
 * `Container` for horizontal rhythm, rather than restating either here.
 *
 * Server Component: no data, no state, no effects.
 */
export default function RecommendationPage() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-h2 text-foreground">Recommendations</h1>
      <p className="text-body text-muted-foreground">Coming soon</p>
      <Link
        href="/"
        className="text-small font-medium text-primary underline-offset-4 hover:underline"
      >
        Back home
      </Link>
    </Container>
  );
}
