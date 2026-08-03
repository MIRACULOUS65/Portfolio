import Image from "next/image";
import { BadgeCheck } from "lucide-react";

import { getProfile } from "@/lib/data-access";
import { cn } from "@/utils/cn";

/**
 * The HeroSection's profile photo (Requirement 7.1, Component_Specification
 * §5 "Avatar — Circular image. Optimized with next/image.").
 *
 * ## Data source
 *
 * `avatar` and `name` are read from the `Profile` record via `getProfile()` —
 * the data-access layer's single entry point (Requirement 4.2) — rather than
 * hardcoded in JSX (Requirement 4.3). The accessible `alt` text is derived
 * from `name` so the image is never announced as an unlabelled graphic and
 * never duplicates a caption already on the page.
 *
 * ## Sizing
 *
 * A fixed intrinsic `width`/`height` is required by `next/image` for a static
 * `public/` asset and reserves the image's box before it loads, so the photo
 * cannot cause layout shift while the HeroSection composes around it
 * (Requirement 24.4 concerns itself with *animated* shift; this avoids the
 * unanimated kind too). The rendered size is controlled by the wrapper's
 * Tailwind classes (`h-full w-full`) rather than the intrinsic attributes, so
 * a caller can fit the avatar into HeroSection's responsive grid without the
 * two ever disagreeing.
 *
 * `rounded-xl` plus `object-cover` gives the image the reference design's
 * rounded-square treatment (not a full circle) regardless of the source
 * photo's own aspect ratio. A small `BadgeCheck` glyph overlaps the
 * bottom-right corner in its own circular chip, matching the "verified"
 * badge in the reference screenshot.
 *
 * Purely presentational Server Component: no state, no effects; the only data
 * read is the static `Profile` record resolved at render time.
 */
export interface AvatarProps {
  /** Extra utilities merged onto the wrapper; conflicting classes win (see `cn`). */
  className?: string;
}

/** Intrinsic pixel size passed to `next/image`. Rendered size is CSS-controlled. */
const AVATAR_INTRINSIC_SIZE = 320;

export function Avatar({ className }: AvatarProps) {
  const { avatar, name } = getProfile();

  return (
    <span
      data-slot="avatar"
      className={cn("relative inline-block h-24 w-24 shrink-0", className)}
    >
      <span className="block h-full w-full overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          src={avatar}
          alt={`${name}'s profile photo`}
          width={AVATAR_INTRINSIC_SIZE}
          height={AVATAR_INTRINSIC_SIZE}
          priority
          className="h-full w-full object-cover"
        />
      </span>
      <span
        data-slot="avatar-badge"
        aria-hidden="true"
        className="absolute -right-1 -bottom-1 flex items-center justify-center rounded-full bg-background p-0.5"
      >
        <BadgeCheck className="size-4 text-primary" />
      </span>
    </span>
  );
}
