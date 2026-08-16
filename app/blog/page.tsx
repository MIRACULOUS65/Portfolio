import { getRecentPublishedBlogs } from "@/lib/data-access";
import { InteractiveFolderGallery, type GalleryPhoto } from "@/components/ui/interactive-folder-gallery";

/**
 * The dedicated Blog page.
 * Features an interactive folder gallery.
 */
export const metadata = {
  title: "Blog",
  description: "Technical articles on web development, React, TypeScript, and software architecture.",
};

export default function BlogPage() {
  const blogs = getRecentPublishedBlogs(0, 100);

  // Prepare photos for the folder gallery from blog covers
  const folderPhotos: GalleryPhoto[] = blogs.slice(0, 5).map((blog, index) => ({
    id: index + 1,
    image: blog.coverImage,
  }));

  // Fallback to default photos if no blogs
  const photos = folderPhotos.length > 0 ? folderPhotos : undefined;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-b from-background to-background hide-footer-page">
      <InteractiveFolderGallery
        photos={photos}
        folderName="Blog.gallery"
        dragHintText="Drag any photo down to close"
      />
    </div>
  );
}
