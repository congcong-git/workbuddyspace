#!/usr/bin/env node

/**
 * 构建搜索索引 JSON
 * 生成 /public/search-index.json 供前端搜索使用
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDirectory = path.join(process.cwd(), 'content/posts');
const outputPath = path.join(process.cwd(), 'public/search-index.json');

function buildSearchIndex() {
  if (!fs.existsSync(postsDirectory)) {
    fs.writeFileSync(outputPath, '[]', 'utf8');
    return;
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter((name) => name.endsWith('.md') || name.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx?$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);
      return {
        slug,
        title: data.title || slug,
        date: data.date || '',
        category: data.category || '未分类',
        tags: data.tags || [],
        summary: data.summary || '',
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2), 'utf8');
  console.log(`✅ 搜索索引已生成，共 ${posts.length} 篇文章`);
}

buildSearchIndex();
