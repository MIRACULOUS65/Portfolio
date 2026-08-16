import IntroAnimation from "@/components/ui/scroll-morph-hero";

/**
 * The dedicated Projects page.
 * Features an interactive scroll-morph hero animation.
 */
export const metadata = {
  title: "Projects",
  description: "Explore all my projects across Web3, AI/ML, and full-stack development.",
};

export default function ProjectsPage() {
  return (
    <div className="h-screen w-full hide-footer-page dark">
      <IntroAnimation />
    </div>
  );
}
