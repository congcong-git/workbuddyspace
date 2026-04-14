import SearchBar from "@/components/search/SearchBar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "搜索",
  description: "搜索文章",
};

export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-bark-700 dark:text-warm-100 mb-3">
          🔍 搜索
        </h1>
        <p className="text-bark-400 dark:text-bark-300">查找你感兴趣的文章</p>
      </div>
      <SearchBar />
    </div>
  );
}
