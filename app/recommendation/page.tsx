"use client";

import { ImageTrail, type ImageTrailImage } from "@/components/ui/image-trail";

/**
 * The dedicated Recommendations page with ImageTrail effect.
 * Features an interactive cursor trail with recommendation images.
 */
export default function RecommendationPage() {
  // Recommendation images - replace with actual recommendation photos
  const trailImages: ImageTrailImage[] = [
    {
      src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
      alt: "Recommendation 1",
    },
    {
      src: "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=800&auto=format&fit=crop",
      alt: "Recommendation 2",
    },
    {
      src: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
      alt: "Recommendation 3",
    },
    {
      src: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800&auto=format&fit=crop",
      alt: "Recommendation 4",
    },
    {
      src: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=800&auto=format&fit=crop",
      alt: "Recommendation 5",
    },
  ];

  return (
    <div className="hide-footer-page">
      <ImageTrail
        images={trailImages}
        className="grid min-h-screen w-full place-items-center bg-background"
        spacing={25}
        duration={800}
        smoothness={0.9}
        imageSize={120}
        cornerRadius={8}
        fadeInDuration={0.2}
        fadeOutDuration={0.4}
        fadeInBlur={0}
        fadeOutBlur={4}
        maxTrailImages={20}
      >
        <div className="pointer-events-none flex flex-col items-center gap-4 text-center px-6">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Recommendations
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg max-w-md">
            Move your cursor to see testimonials and recommendations
          </p>
        </div>
      </ImageTrail>
    </div>
  );
}
