---
title: "用 Next.js 搭建个人博客"
date: "2026-04-13"
category: "技术"
tags: ["Next.js", "React", "TypeScript", "Tailwind CSS"]
summary: "从零开始，用 Next.js + Tailwind CSS 搭建一个温暖文艺风格的个人博客，含相册功能。"
cover: ""
---

## 技术选型

选择 Next.js 作为博客框架，有几个重要原因：

- **SSG 支持** — 静态生成，访问速度快
- **App Router** — 新的路由系统，开发体验好
- **React 生态** — 组件化开发，复用性强

搭配 Tailwind CSS，可以快速实现温暖文艺的视觉风格。

## 项目结构

```
src/
├── app/          # 页面路由
├── components/   # 组件
├── lib/          # 工具库
└── styles/       # 样式
content/
├── posts/        # 文章 (Markdown)
└── albums/       # 相册 (YAML)
```

## 核心功能实现

### Markdown 文章渲染

使用 `gray-matter` 解析 frontmatter，`next-mdx-remote` 渲染内容：

```typescript
const { data, content } = matter(fileContents);
```

### 相册瀑布流

使用 CSS Columns 实现原生瀑布流布局，配合 `yet-another-react-lightbox` 实现灯箱浏览效果。

### 全文搜索

使用 FlexSearch 构建搜索索引，支持中文分词：

```typescript
const index = new FlexSearch.Index({
  tokenize: "forward",
});
```

## 部署

静态导出后部署到 Gitee Pages，免费且稳定。

---

这个博客还在持续完善中，如果你也在搭建自己的博客，希望这篇文章能给你一些参考。✨
