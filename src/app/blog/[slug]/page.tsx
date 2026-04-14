import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import GiscusComment from "@/components/comment/GiscusComment";
import ReadingProgress from "@/components/ui/ReadingProgress";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <>
      <ReadingProgress />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* 返回链接 */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-bark-400 dark:text-bark-300 hover:text-accent-400 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回博客
        </Link>

        {/* 文章头部 */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href={`/categories/${encodeURIComponent(post.category)}`}
              className="px-3 py-1 text-xs font-medium bg-accent-100 dark:bg-accent-700/30 text-accent-500 dark:text-accent-300 rounded-full hover:bg-accent-200 transition-colors"
            >
              {post.category}
            </Link>
            <time className="text-sm text-bark-400 dark:text-bark-300">{post.date}</time>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-bark-700 dark:text-warm-100 leading-tight">
            {post.title}
          </h1>
          {post.summary && (
            <p className="mt-4 text-lg text-bark-400 dark:text-bark-300 leading-relaxed">
              {post.summary}
            </p>
          )}
          {/* 标签 */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="px-2.5 py-0.5 text-xs bg-warm-200 dark:bg-bark-700 text-bark-500 dark:text-bark-200 rounded-full hover:bg-accent-100 dark:hover:bg-accent-700/30 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* 封面图 */}
        {post.cover && (
          <div className="mb-10 rounded-warm-lg overflow-hidden">
            <img
              src={post.cover}
              alt={post.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* 文章内容 */}
        <div className="prose-warm">
          <MDXRemote
            source={post.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </div>

        {/* 分隔线 */}
        <div className="my-12 flex items-center gap-4">
          <div className="flex-1 h-px bg-warm-200 dark:bg-bark-700" />
          <span className="text-bark-300 dark:text-bark-500">✦</span>
          <div className="flex-1 h-px bg-warm-200 dark:bg-bark-700" />
        </div>

        {/* 评论 */}
        <GiscusComment />
      </article>
    </>
  );
}
