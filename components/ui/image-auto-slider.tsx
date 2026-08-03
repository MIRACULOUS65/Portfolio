"use client";

/**
 * An infinite, auto-scrolling horizontal image strip (adapted from the
 * `Ui-Components/Gallery/image-auto-slider.tsx` reference into Tailwind v4
 * syntax and this project's conventions).
 *
 * The image list is rendered twice, back-to-back, and a global
 * `@keyframes scroll-right` rule (declared in `styles/globals.css`, alongside
 * the TechStack marquee's own keyframe) translates the doubled track by
 * exactly one image-set width, so the loop point is invisible. The edges fade
 * via a CSS mask rather than a hard clip, matching `TechCategoryRow`'s own
 * fade treatment.
 *
 * `prefers-reduced-motion: reduce` pauses the animation through the same
 * global media query the marquee uses, keyed off this component's own
 * `data-slot`.
 */
/** Default placeholder images, reused as-is from the Gallery reference. */
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=2152&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=2126&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151?q=80&w=1965&auto=format&fit=crop",
];

export interface ImageAutoSliderProps {
  images?: readonly string[];
  className?: string;
}

export function Component({
  images = DEFAULT_IMAGES,
  className,
}: ImageAutoSliderProps) {
  const duplicatedImages = [...images, ...images];

  return (
    <div
      data-slot="image-auto-slider"
      className={
        "relative w-full overflow-hidden py-4" + (className ? ` ${className}` : "")
      }
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      <div
        data-slot="image-auto-slider-track"
        className="flex w-max gap-6 animation-duration-[35s] repeat-[infinite] [animation-name:scroll-right] [animation-timing-function:linear] motion-reduce:paused"
      >
        {duplicatedImages.map((image, index) => (
          <div
            key={index}
            className="h-32 w-48 shrink-0 overflow-hidden rounded-xl shadow-elevation md:h-40 md:w-64"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- external
                Unsplash placeholder URLs; next/image would require remote
                pattern config for a purely decorative demo strip. */}
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 ease-out hover:scale-105"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
