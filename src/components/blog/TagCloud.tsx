import Link from "next/link";

interface TagCloudProps {
  tags: { name: string; count: number }[];
}

export default function TagCloud({ tags }: TagCloudProps) {
  if (tags.length === 0) return null;

  const maxCount = Math.max(...tags.map((t) => t.count));
  const minCount = Math.min(...tags.map((t) => t.count));

  const getSize = (count: number) => {
    if (maxCount === minCount) return "text-base";
    const ratio = (count - minCount) / (maxCount - minCount);
    if (ratio > 0.7) return "text-2xl";
    if (ratio > 0.4) return "text-xl";
    if (ratio > 0.2) return "text-lg";
    return "text-base";
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center py-8">
      {tags.map((tag) => (
        <Link
          key={tag.name}
          href={`/tags/${encodeURIComponent(tag.name)}`}
          className={`${getSize(tag.count)} px-3 py-1.5 rounded-full bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 hover:bg-accent-100 dark:hover:bg-accent-700/30 hover:text-accent-500 transition-all duration-200 font-medium`}
        >
          #{tag.name}
          <span className="text-xs text-bark-400 ml-1">({tag.count})</span>
        </Link>
      ))}
    </div>
  );
}
