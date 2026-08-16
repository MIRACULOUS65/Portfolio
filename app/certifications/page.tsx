"use client";

import { VerticalImageStack, type StackImage } from "@/components/ui/vertical-image-stack";
import { getAllCertifications } from "@/lib/data-access";

/**
 * The dedicated Certifications page with vertical image stack.
 * Features an interactive 3D card stack with certification badges.
 */
export default function CertificationsPage() {
  const certifications = getAllCertifications();

  // Prepare images from certifications
  const stackImages: StackImage[] = certifications.map((cert) => ({
    id: cert.id,
    src: cert.badgeImage,
    alt: `${cert.title} - ${cert.issuer}`,
  }));

  // Fallback images if no certifications
  const fallbackImages: StackImage[] = [
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
      alt: "Certification 1",
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=800&auto=format&fit=crop",
      alt: "Certification 2",
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
      alt: "Certification 3",
    },
  ];

  const images = stackImages.length > 0 ? stackImages : fallbackImages;

  return (
    <div className="hide-footer-page">
      <VerticalImageStack images={images} />
    </div>
  );
}
