import { getAllPostsFromGitHub } from "@/lib/github-server";
import { getAllPosts, getAllCategories } from "@/lib/posts";
import PostList from "@/components/blog/PostList";
import CategoryBadge from "@/components/blog/CategoryBadge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "博客",
  description: "所有文章列表",
};

// 每次请求获取最新数据
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  // 优先从 GitHub 获取，fallback 到本地
  let posts;
  try {
    posts = await getAllPostsFromGitHub();
  } catch {
    posts = getAllPosts();
  }

  // 分类信息也从 GitHub 数据中提取
  const categories = posts.length > 0
    ? (() => {
        const map = new Map<string, number>();
        posts.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
        return Array.from(map.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
      })()
    : getAllCategories();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-bark-700 dark:text-warm-100 mb-3">
          📝 博客
        </h1>
        <p className="text-bark-400 dark:text-bark-300">记录生活、技术与思考</p>
      </div>

      {/* 分类筛选 */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <CategoryBadge name="全部" count={posts.length} active={true} />
          {categories.map((cat) => (
            <CategoryBadge key={cat.name} name={cat.name} count={cat.count} />
          ))}
        </div>
      )}

      {/* 文章列表 */}
      <PostList posts={posts} emptyText="暂无文章，即将开始书写..." />
    </div>
  );
}
