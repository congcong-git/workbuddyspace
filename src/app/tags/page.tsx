import { getAllTagsFromGitHub } from "@/lib/github-server";
import { getAllTags } from "@/lib/posts";
import TagCloud from "@/components/blog/TagCloud";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "标签",
  description: "按标签浏览文章",
};

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  let tags;
  try {
    tags = await getAllTagsFromGitHub();
  } catch {
    tags = getAllTags();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-bark-700 dark:text-warm-100 mb-3">
          🏷️ 标签
        </h1>
        <p className="text-bark-400 dark:text-bark-300">按标签浏览文章</p>
      </div>

      {tags.length > 0 ? (
        <TagCloud tags={tags} />
      ) : (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">🏷️</span>
          <p className="text-bark-400 dark:text-bark-300">暂无标签</p>
        </div>
      )}
    </div>
  );
}
