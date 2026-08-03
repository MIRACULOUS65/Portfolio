# Fonts

Self-hosted font files loaded by `lib/fonts.ts` through `next/font/local`
(Requirement 2.3). Nothing else in the codebase references these paths — the
loader is the single entry point and exposes the families only as the
`--font-sans` / `--font-mono` CSS variables (Requirement 2.5).

## `instagram-sans/` — PLACEHOLDER FILES, MUST BE SWAPPED

| File                          | Declared weight |
| ----------------------------- | --------------- |
| `InstagramSans-Regular.woff2` | 400             |
| `InstagramSans-Medium.woff2`  | 500             |
| `InstagramSans-SemiBold.woff2`| 600             |
| `InstagramSans-Bold.woff2`    | 700             |

**These four files do not contain Instagram Sans.** Instagram Sans is a
proprietary Meta typeface and is not redistributable, so it cannot be committed
to this repository. Each of the four files above is currently an unmodified
byte copy of the **Geist** variable font (latin subset) shipped inside the
`next` package, used purely as a stand-in so that `next/font/local` has real,
parseable font data to validate and `next build` succeeds.

Because the stand-in is a variable font covering the full 100–900 weight axis,
declaring it four times at 400/500/600/700 in `lib/fonts.ts` still produces four
visually distinct weights in the browser.

### Swapping in the real font

1. Obtain properly licensed Instagram Sans `.woff2` files for weights
   400/500/600/700.
2. Overwrite the four files above, keeping the exact same file names.
3. Nothing else changes — `lib/fonts.ts`, `tailwind.config.ts`, and every
   component already resolve through `--font-sans`.

## `geist-mono/` — real font, not a placeholder

`GeistMono-Regular.woff2` is the genuine Geist Mono variable font (latin
subset), which is the monospace family the design document specifies
(Requirement 2.6). No swap needed.

## Licensing / attribution

Both Geist and Geist Mono are released by Vercel under the
**SIL Open Font License, Version 1.1**, which permits redistribution and
bundling of the font software (including as part of a larger work) provided the
copyright and license notice travel with it:

> Copyright (c) Vercel, Inc. Geist and Geist Mono are licensed under the SIL
> Open Font License, Version 1.1.

Upstream source and full license text: <https://github.com/vercel/geist-font>
(license file: `LICENSE.TXT` in that repository).

The files here are unmodified copies. The typefaces' internal names remain
`Geist` / `Geist Mono`, so no OFL Reserved Font Name has been reused or
misapplied — only the on-disk file names differ, to mark the Instagram Sans
swap-in points documented above.
