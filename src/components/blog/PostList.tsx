import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import PostCard from "./PostCard";

interface PostListProps {
  posts: PostMeta[];
  emptyText?: string;
}

export default function PostList({ posts, emptyText = "暂无文章" }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl mb-4 block">📝</span>
        <p className="text-bark-400 dark:text-bark-300 text-lg">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post, index) => (
        <PostCard key={post.slug} post={post} index={index} />
      ))}
    </div>
  );
}
