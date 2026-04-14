import { getPostsByTag, getAllTags } from "@/lib/posts";
import PostList from "@/components/blog/PostList";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamicParams = true;

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({ tag: tag.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `标签: ${decodeURIComponent(tag)}`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = getPostsByTag(decodedTag);

  if (posts.length === 0) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-bark-700 dark:text-warm-100 mb-3">
          🏷️ #{decodedTag}
        </h1>
        <p className="text-bark-400 dark:text-bark-300">
          共 {posts.length} 篇文章
        </p>
      </div>
      <PostList posts={posts} />
    </div>
  );
}
