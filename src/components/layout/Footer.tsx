import Link from "next/link";
import { siteConfig } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-warm-200 dark:border-bark-700 bg-warm-100/50 dark:bg-bark-800/50 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 关于 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🌿</span>
              <span className="font-serif text-lg font-bold text-bark-700 dark:text-warm-100">
                {siteConfig.name}
              </span>
            </div>
            <p className="text-bark-400 dark:text-bark-300 text-sm leading-relaxed">
              {siteConfig.description}
            </p>
          </div>

          {/* 导航 */}
          <div>
            <h3 className="font-bold text-bark-700 dark:text-warm-100 mb-3">导航</h3>
            <nav className="flex flex-col gap-2">
              {siteConfig.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-bark-400 dark:text-bark-300 hover:text-accent-400 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* 其他链接 */}
          <div>
            <h3 className="font-bold text-bark-700 dark:text-warm-100 mb-3">更多</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/categories"
                className="text-sm text-bark-400 dark:text-bark-300 hover:text-accent-400 transition-colors"
              >
                分类
              </Link>
              <Link
                href="/tags"
                className="text-sm text-bark-400 dark:text-bark-300 hover:text-accent-400 transition-colors"
              >
                标签
              </Link>
              <Link
                href="/search"
                className="text-sm text-bark-400 dark:text-bark-300 hover:text-accent-400 transition-colors"
              >
                搜索
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-warm-200 dark:border-bark-700 text-center">
          <p className="text-sm text-bark-400 dark:text-bark-300">
            © {new Date().getFullYear()} {siteConfig.author.name} · 用 ❤️ 和 Next.js 构建
          </p>
        </div>
      </div>
    </footer>
  );
}
