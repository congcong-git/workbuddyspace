// 服务端 GitHub API 数据获取模块
// 用于动态渲染页面时从 GitHub 仓库实时读取内容
// 使用环境变量 GITHUB_TOKEN（服务端安全）

const GITHUB_API = "https://api.github.com";
const OWNER = process.env.GITHUB_OWNER || "congcong-git";
const REPO = process.env.GITHUB_REPO || "workbuddyspace";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN || "";

function headers() {
  return {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

// UTF-8 安全的 base64 解码
function decodeBase64UTF8(base64: string): string {
  const binaryString = Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  summary: string;
  cover: string;
}

export interface Post extends PostMeta {
  content: string;
}

export interface Photo {
  src: string;
  caption: string;
}

export interface Album {
  slug: string;
  name: string;
  description: string;
  cover: string;
  date: string;
  photos: Photo[];
}

// 获取目录下的文件列表
async function getDirectoryList(path: string): Promise<{ name: string; path: string }[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: headers(), next: { revalidate: 30 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data
    .filter((item: { type: string }) => item.type === "file")
    .map((item: { name: string; path: string }) => ({ name: item.name, path: item.path }));
}

// 获取单个文件内容
async function getFileContent(path: string): Promise<string | null> {
  const res = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: headers(), next: { revalidate: 30 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return decodeBase64UTF8(data.content);
}

// 获取所有文章（元信息列表）
export async function getAllPostsFromGitHub(): Promise<PostMeta[]> {
  const files = await getDirectoryList("content/posts");
  const posts: PostMeta[] = [];

  // 动态导入 gray-matter（仅服务端使用）
  const matter = (await import("gray-matter")).default;

  for (const file of files) {
    if (!file.name.endsWith(".md") && !file.name.endsWith(".mdx")) continue;
    const content = await getFileContent(file.path);
    if (!content) continue;

    const { data } = matter(content);
    posts.push({
      slug: file.name.replace(/\.mdx?$/, ""),
      title: (data.title as string) || file.name,
      date: (data.date as string) || "",
      category: (data.category as string) || "未分类",
      tags: (data.tags as string[]) || [],
      summary: (data.summary as string) || "",
      cover: (data.cover as string) || "",
    });
  }

  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

// 获取单篇文章（含正文）
export async function getPostBySlugFromGitHub(slug: string): Promise<Post | null> {
  const content = await getFileContent(`content/posts/${slug}.md`);
  if (!content) {
    // 尝试 .mdx
    const mdxContent = await getFileContent(`content/posts/${slug}.mdx`);
    if (!mdxContent) return null;
    return parsePostContent(slug, mdxContent);
  }
  return parsePostContent(slug, content);
}

async function parsePostContent(slug: string, content: string): Promise<Post> {
  const matter = (await import("gray-matter")).default;
  const { data, content: body } = matter(content);
  return {
    slug,
    title: (data.title as string) || slug,
    date: (data.date as string) || "",
    category: (data.category as string) || "未分类",
    tags: (data.tags as string[]) || [],
    summary: (data.summary as string) || "",
    cover: (data.cover as string) || "",
    content: body,
  };
}

// 获取所有相册
export async function getAllAlbumsFromGitHub(): Promise<Album[]> {
  const files = await getDirectoryList("content/albums");
  const albums: Album[] = [];

  const yaml = (await import("js-yaml")).default;

  for (const file of files) {
    if (!file.name.endsWith(".yaml") && !file.name.endsWith(".yml")) continue;
    const content = await getFileContent(file.path);
    if (!content) continue;

    const data = yaml.load(content) as Record<string, unknown>;
    albums.push({
      slug: file.name.replace(/\.ya?ml$/, ""),
      name: (data.name as string) || file.name,
      description: (data.description as string) || "",
      cover: (data.cover as string) || "",
      date: (data.date as string) || "",
      photos: (data.photos as Photo[]) || [],
    });
  }

  return albums.sort((a, b) => (a.date > b.date ? -1 : 1));
}

// 获取单个相册
export async function getAlbumBySlugFromGitHub(slug: string): Promise<Album | null> {
  const content = await getFileContent(`content/albums/${slug}.yaml`)
    || await getFileContent(`content/albums/${slug}.yml`);
  if (!content) return null;

  const yaml = (await import("js-yaml")).default;
  const data = yaml.load(content) as Record<string, unknown>;

  return {
    slug,
    name: (data.name as string) || slug,
    description: (data.description as string) || "",
    cover: (data.cover as string) || "",
    date: (data.date as string) || "",
    photos: (data.photos as Photo[]) || [],
  };
}

// 获取所有分类
export async function getAllCategoriesFromGitHub(): Promise<{ name: string; count: number }[]> {
  const posts = await getAllPostsFromGitHub();
  const map = new Map<string, number>();
  posts.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// 获取所有标签
export async function getAllTagsFromGitHub(): Promise<{ name: string; count: number }[]> {
  const posts = await getAllPostsFromGitHub();
  const map = new Map<string, number>();
  posts.forEach((p) => p.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// 按分类获取文章
export async function getPostsByCategoryFromGitHub(category: string): Promise<PostMeta[]> {
  return (await getAllPostsFromGitHub()).filter((p) => p.category === category);
}

// 按标签获取文章
export async function getPostsByTagFromGitHub(tag: string): Promise<PostMeta[]> {
  return (await getAllPostsFromGitHub()).filter((p) => p.tags.includes(tag));
}
