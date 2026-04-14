import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

interface PostCardProps {
  post: PostMeta;
  index?: number;
}

export default function PostCard({ post, index = 0 }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group bg-white dark:bg-bark-800 rounded-warm-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-warm-200 dark:border-bark-700 hover:border-accent-300 dark:hover:border-accent-500">
        {/* 封面图 */}
        {post.cover && (
          <div className="relative overflow-hidden aspect-[16/9]">
            <img
              src={post.cover}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        <div className="p-5">
          {/* 分类和日期 */}
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2.5 py-0.5 text-xs font-medium bg-accent-100 dark:bg-accent-700/30 text-accent-500 dark:text-accent-300 rounded-full">
              {post.category}
            </span>
            <time className="text-xs text-bark-400 dark:text-bark-300">
              {post.date}
            </time>
          </div>

          {/* 标题 */}
          <h2 className="font-serif text-lg font-bold text-bark-700 dark:text-warm-100 group-hover:text-accent-400 dark:group-hover:text-accent-400 transition-colors mb-2 line-clamp-2">
            {post.title}
          </h2>

          {/* 摘要 */}
          {post.summary && (
            <p className="text-sm text-bark-400 dark:text-bark-300 line-clamp-2 leading-relaxed">
              {post.summary}
            </p>
          )}

          {/* 标签 */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-warm-100 dark:bg-bark-700 text-bark-500 dark:text-bark-200 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
