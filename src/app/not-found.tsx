import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
      <span className="text-8xl block mb-6">🍃</span>
      <h1 className="font-serif text-4xl font-bold text-bark-700 dark:text-warm-100 mb-4">
        迷路了
      </h1>
      <p className="text-bark-400 dark:text-bark-300 text-lg mb-8">
        这个页面似乎不存在，或许它去了一个更温暖的地方
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link
          href="/"
          className="px-6 py-2.5 bg-accent-400 text-white rounded-full font-medium hover:bg-accent-500 transition-colors shadow-md"
        >
          回到首页
        </Link>
        <Link
          href="/blog"
          className="px-6 py-2.5 bg-white dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full font-medium hover:bg-warm-100 dark:hover:bg-bark-600 transition-colors border border-warm-200 dark:border-bark-600"
        >
          看看文章
        </Link>
      </div>
    </div>
  );
}
