import { ImageStreamHero, type StreamImage } from "@/components/ui/image-stream-hero";

/**
 * The dedicated Hackathons page.
 * Features an interactive image stream corridor hero showcasing hackathon photos.
 */
export const metadata = {
  title: "Hackathons",
  description: "Hackathon achievements and project showcases from competitions worldwide.",
};

export default function HackathonsPage() {
  // Use 15 hackathon images from the public folder with "Hacktonix" label
  const REAL_HACKATHON_IMAGES: StreamImage[] = [
    { src: "/images/hackathons/pic1.webp", alt: "Hackathon event 1", label: "Educhain" },
    { src: "/images/hackathons/pic2.webp", alt: "Hackathon event 2", label: "Avalanche" },
    { src: "/images/hackathons/pic3.webp", alt: "Hackathon event 3", label: "Algorand" },
    { src: "/images/hackathons/pic4.webp", alt: "Hackathon event 4", label: "Celo" },
    { src: "/images/hackathons/pic5.webp", alt: "Hackathon event 5", label: "Stellar" },
    { src: "/images/hackathons/pic6.webp", alt: "Hackathon event 6", label: "Code-Frost" },
    { src: "/images/hackathons/pic7.webp", alt: "Hackathon event 7", label: "Hackinverse" },
    { src: "/images/hackathons/pic8.webp", alt: "Hackathon event 8", label: "Doubleslah" },
    { src: "/images/hackathons/pic9.webp", alt: "Hackathon event 9", label: "BinaryV2" },
    { src: "/images/hackathons/pic10.webp", alt: "Hackathon event 10", label: "Hacktropica" },
    { src: "/images/hackathons/pic11.webp", alt: "Hackathon event 11", label: "Hacktonix" },
    { src: "/images/hackathons/pic12.webp", alt: "Hackathon event 12", label: "Hackolution" },
    { src: "/images/hackathons/pic13.webp", alt: "Hackathon event 13", label: "Hackinverse" },
    { src: "/images/hackathons/pic14.webp", alt: "Hackathon event 14", label: "Hacktropica" },
    { src: "/images/hackathons/pic15.webp", alt: "Hackathon event 15", label: "BinaryV2" },
  ];

  const images = REAL_HACKATHON_IMAGES;

  return (
    <div className="hide-footer-page">
      <ImageStreamHero
        images={images}
        className="h-screen w-full bg-background"
        cards={15}
        speed={16}
        axis={55}
      >
        <div className="relative z-10 flex h-full flex-col items-center justify-between py-12 text-center">
          <div className="px-6">
            <h1 className="text-balance text-4xl font-medium tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Hackathon
            </h1>
            <p className="mt-2 text-xl text-muted-foreground sm:text-2xl">
              Memories
            </p>
          </div>
          <div className="max-w-md px-6">
            <p className="text-balance text-sm text-muted-foreground sm:text-base">
              Competition projects built under pressure,
              showcasing rapid prototyping and creative problem-solving.
            </p>
          </div>
        </div>
      </ImageStreamHero>
    </div>
  );
}
