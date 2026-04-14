import { siteConfig } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于",
  description: "关于我",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-12">
        {/* 头像 */}
        <div className="w-32 h-32 rounded-full bg-warm-200 dark:bg-bark-700 border-4 border-white dark:border-bark-600 shadow-lg flex items-center justify-center text-6xl mx-auto mb-6">
          🌿
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-bark-700 dark:text-warm-100 mb-3">
          {siteConfig.author.name}
        </h1>
        <p className="text-bark-400 dark:text-bark-300 text-lg leading-relaxed">
          {siteConfig.author.bio}
        </p>
      </div>

      {/* 关于内容 */}
      <div className="prose-warm space-y-6">
        <section className="bg-white dark:bg-bark-800 rounded-warm-lg p-6 sm:p-8 border border-warm-200 dark:border-bark-700">
          <h2 className="font-serif text-xl font-bold text-bark-700 dark:text-warm-100 mb-4 flex items-center gap-2">
            <span>👋</span> 你好
          </h2>
          <p className="text-bark-500 dark:text-bark-200 leading-relaxed">
            欢迎来到我的小站！这里是我记录生活、分享技术和表达思考的地方。
            我相信文字和影像都有治愈人心的力量，希望这里的内容能给你带来一些温暖和启发。
          </p>
        </section>

        <section className="bg-white dark:bg-bark-800 rounded-warm-lg p-6 sm:p-8 border border-warm-200 dark:border-bark-700">
          <h2 className="font-serif text-xl font-bold text-bark-700 dark:text-warm-100 mb-4 flex items-center gap-2">
            <span>💡</span> 兴趣
          </h2>
          <div className="flex flex-wrap gap-2">
            {["编程", "阅读", "摄影", "旅行", "咖啡", "音乐", "写作", "设计"].map(
              (interest) => (
                <span
                  key={interest}
                  className="px-3 py-1.5 bg-warm-100 dark:bg-bark-700 text-bark-500 dark:text-bark-200 rounded-full text-sm"
                >
                  {interest}
                </span>
              )
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-bark-800 rounded-warm-lg p-6 sm:p-8 border border-warm-200 dark:border-bark-700">
          <h2 className="font-serif text-xl font-bold text-bark-700 dark:text-warm-100 mb-4 flex items-center gap-2">
            <span>🛠️</span> 技术栈
          </h2>
          <div className="flex flex-wrap gap-2">
            {["Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js", "Python"].map(
              (tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 bg-accent-50 dark:bg-accent-700/20 text-accent-500 dark:text-accent-300 rounded-full text-sm"
                >
                  {tech}
                </span>
              )
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-bark-800 rounded-warm-lg p-6 sm:p-8 border border-warm-200 dark:border-bark-700">
          <h2 className="font-serif text-xl font-bold text-bark-700 dark:text-warm-100 mb-4 flex items-center gap-2">
            <span>🔗</span> 联系我
          </h2>
          <p className="text-bark-500 dark:text-bark-200 leading-relaxed">
            如果你想要交流或合作，欢迎通过以下方式联系我：
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="px-4 py-2 bg-warm-100 dark:bg-bark-700 text-bark-500 dark:text-bark-200 rounded-full text-sm">
              📧 Email
            </span>
            <span className="px-4 py-2 bg-warm-100 dark:bg-bark-700 text-bark-500 dark:text-bark-200 rounded-full text-sm">
              💬 微信
            </span>
            <span className="px-4 py-2 bg-warm-100 dark:bg-bark-700 text-bark-500 dark:text-bark-200 rounded-full text-sm">
              🐙 GitHub
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
