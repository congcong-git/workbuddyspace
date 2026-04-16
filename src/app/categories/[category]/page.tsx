import { getPostsByCategoryFromGitHub, getAllCategoriesFromGitHub } from "@/lib/github-server";
import { getPostsByCategory, getAllCategories } from "@/lib/posts";
import PostList from "@/components/blog/PostList";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((cat) => ({ category: cat.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `分类: ${decodeURIComponent(category)}`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);

  let posts;
  try {
    posts = await getPostsByCategoryFromGitHub(decodedCategory);
  } catch {
    posts = getPostsByCategory(decodedCategory);
  }

  if (posts.length === 0) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-bark-700 dark:text-warm-100 mb-3">
          📂 {decodedCategory}
        </h1>
        <p className="text-bark-400 dark:text-bark-300">
          共 {posts.length} 篇文章
        </p>
      </div>
      <PostList posts={posts} />
    </div>
  );
}
