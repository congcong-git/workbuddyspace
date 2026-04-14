import Link from "next/link";

interface CategoryBadgeProps {
  name: string;
  count?: number;
  active?: boolean;
}

export default function CategoryBadge({ name, count, active = false }: CategoryBadgeProps) {
  return (
    <Link
      href={`/categories/${encodeURIComponent(name)}`}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-accent-400 text-white shadow-md"
          : "bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 hover:bg-accent-100 dark:hover:bg-accent-700/30 hover:text-accent-500"
      }`}
    >
      {name}
      {count !== undefined && (
        <span className={`text-xs ${active ? "text-white/80" : "text-bark-400"}`}>
          {count}
        </span>
      )}
    </Link>
  );
}
