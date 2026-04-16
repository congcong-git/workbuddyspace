import Link from "next/link";
import { getAllPostsFromGitHub, getAllAlbumsFromGitHub } from "@/lib/github-server";
import { getAllPosts } from "@/lib/posts";
import { getAllAlbums } from "@/lib/albums";
import PostCard from "@/components/blog/PostCard";
import AlbumCard from "@/components/album/AlbumCard";
import { siteConfig } from "@/lib/constants";

// 首页也动态渲染，确保最新内容可见
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 优先从 GitHub 获取，fallback 到本地
  let posts, albums;
  try {
    posts = (await getAllPostsFromGitHub()).slice(0, 4);
  } catch {
    posts = getAllPosts().slice(0, 4);
  }
  try {
    albums = (await getAllAlbumsFromGitHub()).slice(0, 3);
  } catch {
    albums = getAllAlbums().slice(0, 3);
  }

  return (
    <div className="paper-texture">
      {/* Hero 区域 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-warm-100 via-accent-50 to-warm-200 dark:from-bark-800 dark:via-bark-800 dark:to-bark-700 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center text-center">
            {/* 头像 */}
            <div className="w-28 h-28 rounded-full bg-warm-300 dark:bg-bark-600 border-4 border-white dark:border-bark-700 shadow-lg flex items-center justify-center text-5xl mb-6">
              🌿
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-bark-700 dark:text-warm-100 mb-4">
              {siteConfig.author.name}的小站
            </h1>
            <p className="text-lg text-bark-400 dark:text-bark-300 max-w-lg leading-relaxed">
              {siteConfig.author.bio}
            </p>
            <div className="flex items-center gap-4 mt-8">
              <Link
                href="/blog"
                className="px-6 py-2.5 bg-accent-400 text-white rounded-full font-medium hover:bg-accent-500 transition-colors shadow-md hover:shadow-lg"
              >
                读文章
              </Link>
              <Link
                href="/albums"
                className="px-6 py-2.5 bg-white dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full font-medium hover:bg-warm-100 dark:hover:bg-bark-600 transition-colors border border-warm-200 dark:border-bark-600"
              >
                看相册
              </Link>
            </div>
          </div>
        </div>
        {/* 装饰元素 */}
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gradient-to-t from-warm-50 dark:from-bark-900 to-transparent" />
      </section>

      {/* 最新文章 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl font-bold text-bark-700 dark:text-warm-100">
            📝 最新文章
          </h2>
          <Link
            href="/blog"
            className="text-accent-400 hover:text-accent-500 font-medium text-sm transition-colors"
          >
            查看全部 →
          </Link>
        </div>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post, index) => (
              <PostCard key={post.slug} post={post} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700">
            <span className="text-4xl block mb-3">✍️</span>
            <p className="text-bark-400 dark:text-bark-300">还没有文章，即将开始书写...</p>
          </div>
        )}
      </section>

      {/* 精选相册 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl font-bold text-bark-700 dark:text-warm-100">
            📷 精选相册
          </h2>
          <Link
            href="/albums"
            className="text-accent-400 hover:text-accent-500 font-medium text-sm transition-colors"
          >
            查看全部 →
          </Link>
        </div>
        {albums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {albums.map((album) => (
              <AlbumCard key={album.slug} album={album} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700">
            <span className="text-4xl block mb-3">📷</span>
            <p className="text-bark-400 dark:text-bark-300">还没有相册，即将开始记录...</p>
          </div>
        )}
      </section>

      {/* 快捷入口 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "📂", label: "分类", href: "/categories", desc: "按主题浏览" },
            { icon: "🏷️", label: "标签", href: "/tags", desc: "按标签浏览" },
            { icon: "🔍", label: "搜索", href: "/search", desc: "查找文章" },
            { icon: "👤", label: "关于", href: "/about", desc: "了解我" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-5 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700 hover:border-accent-300 dark:hover:border-accent-500 transition-all text-center group"
            >
              <span className="text-3xl block mb-2">{item.icon}</span>
              <span className="font-bold text-bark-700 dark:text-warm-100 group-hover:text-accent-400 transition-colors">
                {item.label}
              </span>
              <p className="text-xs text-bark-400 dark:text-bark-300 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
