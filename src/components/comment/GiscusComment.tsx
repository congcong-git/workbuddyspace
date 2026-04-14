"use client";

import Giscus from "@giscus/react";
import { useTheme } from "next-themes";
import { siteConfig } from "@/lib/constants";

export default function GiscusComment() {
  const { theme } = useTheme();

  if (!siteConfig.giscus.repo) {
    return (
      <div className="mt-10 p-6 bg-warm-100 dark:bg-bark-800 rounded-warm-lg text-center">
        <p className="text-bark-400 dark:text-bark-300 text-sm">
          💬 评论系统配置中，敬请期待...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <Giscus
        repo={siteConfig.giscus.repo as `${string}/${string}`}
        repoId={siteConfig.giscus.repoId}
        category={siteConfig.giscus.category}
        categoryId={siteConfig.giscus.categoryId}
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme === "dark" ? "dark_tritanopia" : "light"}
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
