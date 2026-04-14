import { getAllCategories } from "@/lib/posts";
import CategoryBadge from "@/components/blog/CategoryBadge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "分类",
  description: "按分类浏览文章",
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-bark-700 dark:text-warm-100 mb-3">
          📂 分类
        </h1>
        <p className="text-bark-400 dark:text-bark-300">按主题浏览文章</p>
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((cat) => (
            <CategoryBadge key={cat.name} name={cat.name} count={cat.count} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">📂</span>
          <p className="text-bark-400 dark:text-bark-300">暂无分类</p>
        </div>
      )}
    </div>
  );
}
