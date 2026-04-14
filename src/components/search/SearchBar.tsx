"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";

interface PostMeta {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  date: string;
}

interface SearchResult {
  slug: string;
  title: string;
  category: string;
  summary: string;
  date: string;
}

// 简单的前端搜索实现
function simpleSearch(posts: PostMeta[], query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return posts
    .filter((post) => {
      const searchText = `${post.title} ${post.summary} ${post.tags.join(" ")} ${post.category}`.toLowerCase();
      return searchText.includes(q);
    })
    .slice(0, 20)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      category: post.category,
      summary: post.summary,
      date: post.date,
    }));
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载文章数据
  useEffect(() => {
    fetch("/search-index.json")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      setResults(simpleSearch(posts, value));
    },
    [posts]
  );

  // 快捷键聚焦
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bark-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="搜索文章... (Ctrl+K)"
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-warm-lg text-bark-700 dark:text-warm-100 placeholder-bark-300 dark:placeholder-bark-400 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all shadow-sm"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((result) => (
            <Link
              key={result.slug}
              href={`/blog/${result.slug}`}
              className="block p-4 bg-white dark:bg-bark-800 rounded-warm border border-warm-200 dark:border-bark-600 hover:border-accent-300 dark:hover:border-accent-500 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 bg-accent-100 dark:bg-accent-700/30 text-accent-500 dark:text-accent-300 rounded-full">
                  {result.category}
                </span>
                <time className="text-xs text-bark-400">{result.date}</time>
              </div>
              <h3 className="font-serif font-bold text-bark-700 dark:text-warm-100">
                {result.title}
              </h3>
              {result.summary && (
                <p className="text-sm text-bark-400 dark:text-bark-300 mt-1 line-clamp-2">
                  {result.summary}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {query && results.length === 0 && !loading && (
        <div className="mt-8 text-center">
          <span className="text-4xl block mb-2">🔍</span>
          <p className="text-bark-400 dark:text-bark-300">
            没有找到与「{query}」相关的文章
          </p>
        </div>
      )}
    </div>
  );
}
