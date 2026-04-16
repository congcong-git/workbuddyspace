"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getFileContent,
  getDirectoryList,
  saveFile,
  deleteFile,
  uploadImage,
} from "@/lib/github";
import matter from "gray-matter";
import yaml from "js-yaml";

// ========== 类型定义 ==========
interface PostData {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  summary: string;
  cover: string;
  content: string;
  sha: string;
}

interface AlbumData {
  slug: string;
  name: string;
  description: string;
  cover: string;
  date: string;
  photos: { src: string; caption: string }[];
  sha: string;
}

type Tab = "posts" | "albums" | "categories" | "tags" | "new-post" | "edit-post" | "new-album" | "edit-album";

// ========== 主组件 ==========
export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [albums, setAlbums] = useState<AlbumData[]>([]);
  const [editingPost, setEditingPost] = useState<PostData | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<AlbumData | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 从文章中提取所有分类和标签
  const allCategories = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) => p.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  useEffect(() => {
    const session = sessionStorage.getItem("admin_session");
    const ghToken = sessionStorage.getItem("github_token");
    if (session && ghToken) setAuthenticated(true);
  }, []);

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // 触发 Vercel 重新部署
  const triggerRedeploy = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("admin_session");
      await fetch("/api/admin/redeploy", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
    } catch {
      // 静默失败，不影响用户操作
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({ success: false, message: "服务器响应异常" }));
      if (data.success) {
        sessionStorage.setItem("admin_session", data.sessionToken);
        sessionStorage.setItem("github_token", data.githubToken);
        setAuthenticated(true);
        loadData();
        showMessage("success", "登录成功！");
      } else {
        showMessage("error", data.message || "用户名或密码错误");
      }
    } catch {
      showMessage("error", "登录失败，请检查网络");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session");
    sessionStorage.removeItem("github_token");
    setUsername("");
    setPassword("");
    setAuthenticated(false);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const postFiles = await getDirectoryList("content/posts");
      const postData: PostData[] = [];
      for (const file of postFiles) {
        const result = await getFileContent(file.path);
        if (result) {
          const { data, content } = matter(result.content);
          postData.push({
            slug: file.name.replace(/\.mdx?$/, ""),
            title: data.title || "",
            date: data.date || "",
            category: data.category || "未分类",
            tags: data.tags || [],
            summary: data.summary || "",
            cover: data.cover || "",
            content,
            sha: result.sha,
          });
        }
      }
      postData.sort((a, b) => (a.date > b.date ? -1 : 1));
      setPosts(postData);

      const albumFiles = await getDirectoryList("content/albums");
      const albumData: AlbumData[] = [];
      for (const file of albumFiles) {
        const result = await getFileContent(file.path);
        if (result) {
          const data = yaml.load(result.content) as Record<string, unknown>;
          albumData.push({
            slug: file.name.replace(/\.ya?ml$/, ""),
            name: (data.name as string) || "",
            description: (data.description as string) || "",
            cover: (data.cover as string) || "",
            date: (data.date as string) || "",
            photos: (data.photos as { src: string; caption: string }[]) || [],
            sha: result.sha,
          });
        }
      }
      albumData.sort((a, b) => (a.date > b.date ? -1 : 1));
      setAlbums(albumData);
    } catch {
      showMessage("error", "加载数据失败");
    }
    setLoading(false);
  }, [showMessage]);

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, loadData]);

  // ========== 中文标题转 Slug 的映射 ==========
  const slugMap: Record<string, string> = {
    "技术": "tech", "随笔": "essay", "阅读": "reading", "摄影": "photography", "生活": "life",
    "旅行": "travel", "美食": "food", "设计": "design", "音乐": "music", "电影": "movie",
    "编程": "coding", "前端": "frontend", "后端": "backend", "教程": "tutorial",
    "笔记": "notes", "心得": "insights", "分享": "share", "入门": "getting-started",
    "指南": "guide", "实战": "practice", "优化": "optimization", "思考": "thoughts",
    "搭建": "build", "配置": "setup", "基础": "basics",
    "高级": "advanced", "工具": "tools", "资源": "resources", "推荐": "recommend",
    "总结": "summary", "回顾": "review", "规划": "plan", "目标": "goals",
    "春日": "spring", "夏日": "summer", "秋日": "autumn", "冬日": "winter",
    "个人": "personal", "成长": "growth", "感悟": "reflections", "记录": "journal",
    "城市": "city", "自然": "nature", "建筑": "architecture", "人文": "culture",
  };

  // 根据 title 自动生成 slug
  const generateSlug = (title: string): string => {
    // 尝试中文关键词映射
    const parts: string[] = [];
    let remaining = title;
    let found = true;
    while (remaining.length > 0 && found) {
      found = false;
      for (const [cn, en] of Object.entries(slugMap)) {
        if (remaining.startsWith(cn)) {
          parts.push(en);
          remaining = remaining.slice(cn.length);
          found = true;
          break;
        }
      }
    }
    // 如果映射匹配了大部分内容，用映射结果
    if (parts.length > 0 && remaining.length < title.length * 0.5) {
      if (remaining.length > 0) {
        // 剩余部分转拼音（简单处理：用时间戳后缀）
        parts.push(Date.now().toString(36).slice(-4));
      }
      return parts.join("-");
    }
    // 如果没有匹配到中文映射，用时间戳生成
    const now = new Date();
    const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    return `post-${datePrefix}`;
  };

  // ========== 文章编辑器 ==========
  const PostEditor = ({ post, onSave, onCancel, onRedeploy }: { post: PostData | null; onSave: () => void; onCancel: () => void; onRedeploy: () => void }) => {
    const [form, setForm] = useState({
      title: post?.title || "",
      date: post?.date || new Date().toISOString().split("T")[0],
      category: post?.category || "",
      selectedTags: post?.tags || [] as string[],
      summary: post?.summary || "",
      cover: post?.cover || "",
      content: post?.content || "",
    });
    const [slug, setSlug] = useState(post?.slug || "");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!post);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [showNewTag, setShowNewTag] = useState(false);
    const [localMsg, setLocalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const showLocalMsg = (type: "success" | "error", text: string) => {
      setLocalMsg({ type, text });
      setTimeout(() => setLocalMsg(null), 3000);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "cover" | "content") => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const url = await uploadImage(file, "posts");
      if (url) {
        if (target === "cover") setForm({ ...form, cover: url });
        else setForm({ ...form, content: form.content + `\n![${file.name}](${url})\n` });
        showLocalMsg("success", "图片上传成功！");
      } else {
        showLocalMsg("error", "图片上传失败");
      }
      setUploading(false);
    };

    const toggleTag = (tag: string) => {
      if (form.selectedTags.includes(tag)) {
        setForm({ ...form, selectedTags: form.selectedTags.filter((t) => t !== tag) });
      } else {
        setForm({ ...form, selectedTags: [...form.selectedTags, tag] });
      }
    };

    const addNewCategory = () => {
      if (newCategory.trim()) {
        setForm({ ...form, category: newCategory.trim() });
        setNewCategory("");
        setShowNewCategory(false);
      }
    };

    const addNewTag = () => {
      const t = newTag.trim();
      if (t && !form.selectedTags.includes(t)) {
        setForm({ ...form, selectedTags: [...form.selectedTags, t] });
        setNewTag("");
        setShowNewTag(false);
      }
    };

    const handleSave = async () => {
      if (!form.title || !slug) { showLocalMsg("error", "标题和 slug 不能为空"); return; }
      setSaving(true);
      const frontmatter = {
        title: form.title,
        date: form.date,
        category: form.category || "未分类",
        tags: form.selectedTags,
        summary: form.summary,
        cover: form.cover,
      };
      const fileContent = matter.stringify(form.content, frontmatter);
      const existingPost = post ? posts.find((p) => p.slug === slug) : null;
      const sha = existingPost?.sha;
      const success = await saveFile(`content/posts/${slug}.md`, fileContent, `${post ? "更新" : "发布"}文章: ${form.title}`, sha);
      if (success) {
        showLocalMsg("success", `文章${post ? "更新" : "发布"}成功！内容已即时更新`);
        onRedeploy();
        onSave();
      } else {
        showLocalMsg("error", "保存失败，请重试");
      }
      setSaving(false);
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-bark-700 dark:text-warm-100">
            {post ? "✏️ 编辑文章" : "✍️ 发布新文章"}
          </h2>
          <button onClick={onCancel} className="text-bark-400 hover:text-bark-600 transition-colors">取消</button>
        </div>

        {localMsg && (
          <div className={`px-4 py-2.5 rounded-warm-lg text-sm font-medium ${localMsg.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}>
            {localMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">文章标题</label>
            <input value={form.title} onChange={(e) => {
              const newTitle = e.target.value;
              setForm({ ...form, title: newTitle });
              // 自动生成 slug（仅在未手动修改时）
              if (!slugManuallyEdited && !post) {
                setSlug(newTitle ? generateSlug(newTitle) : "");
              }
            }}
              className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="输入文章标题" />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">
              URL Slug {!post && <span className="text-xs text-bark-400 font-normal">（根据标题自动生成，可手动修改）</span>}
            </label>
            <input value={slug} onChange={(e) => { setSlug(e.target.value.replace(/[^a-z0-9-]/g, "")); setSlugManuallyEdited(true); }}
              className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="auto-generated-from-title" disabled={!!post} />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">日期</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" />
          </div>
          {/* 分类选择 */}
          <div>
            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">分类</label>
            <div className="flex gap-2">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="flex-1 px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400">
                <option value="">请选择分类</option>
                {allCategories.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
              </select>
              <button onClick={() => setShowNewCategory(!showNewCategory)}
                className="px-3 py-2 bg-accent-100 dark:bg-accent-700/30 text-accent-500 dark:text-accent-300 rounded-lg text-sm hover:bg-accent-200 transition-colors whitespace-nowrap">
                + 新建
              </button>
            </div>
            {showNewCategory && (
              <div className="flex gap-2 mt-2">
                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNewCategory()}
                  className="flex-1 px-3 py-1.5 bg-warm-50 dark:bg-bark-700 border border-warm-200 dark:border-bark-600 rounded-lg text-sm text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400"
                  placeholder="输入新分类名" />
                <button onClick={addNewCategory} className="px-3 py-1.5 bg-accent-400 text-white rounded-lg text-sm hover:bg-accent-500 transition-colors">确定</button>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">封面图</label>
            <div className="flex gap-2">
              <input value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })}
                className="flex-1 px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="/images/posts/cover.jpg" />
              <label className="px-3 py-2 bg-warm-200 dark:bg-bark-700 rounded-lg cursor-pointer hover:bg-warm-300 dark:hover:bg-bark-600 transition-colors text-sm whitespace-nowrap">
                {uploading ? "上传中..." : "上传"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "cover")} />
              </label>
            </div>
          </div>
        </div>

        {/* 标签选择 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200">标签</label>
            <button onClick={() => setShowNewTag(!showNewTag)}
              className="px-3 py-1 bg-accent-100 dark:bg-accent-700/30 text-accent-500 dark:text-accent-300 rounded-lg text-xs hover:bg-accent-200 transition-colors">
              + 新建标签
            </button>
          </div>
          {showNewTag && (
            <div className="flex gap-2 mb-3">
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNewTag()}
                className="flex-1 px-3 py-1.5 bg-warm-50 dark:bg-bark-700 border border-warm-200 dark:border-bark-600 rounded-lg text-sm text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400"
                placeholder="输入新标签名" />
              <button onClick={addNewTag} className="px-3 py-1.5 bg-accent-400 text-white rounded-lg text-sm hover:bg-accent-500 transition-colors">确定</button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button key={tag.name} type="button" onClick={() => toggleTag(tag.name)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  form.selectedTags.includes(tag.name)
                    ? "bg-accent-400 text-white shadow-sm"
                    : "bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 hover:bg-warm-300 dark:hover:bg-bark-600"
                }`}>
                #{tag.name}
                <span className="ml-1 text-xs opacity-70">({tag.count})</span>
              </button>
            ))}
            {/* 已选但不在已有标签中的（新加的标签） */}
            {form.selectedTags.filter((t) => !allTags.some((at) => at.name === t)).map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-accent-400 text-white shadow-sm transition-all">
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">摘要</label>
          <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="一句话概括文章内容" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200">正文（Markdown）</label>
            <label className="px-3 py-1 text-xs bg-warm-200 dark:bg-bark-700 rounded cursor-pointer hover:bg-warm-300 dark:hover:bg-bark-600 transition-colors">
              📷 插入图片
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "content")} />
            </label>
          </div>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={20} className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400 font-mono text-sm leading-relaxed" placeholder="用 Markdown 写你的文章..." />
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-accent-400 text-white rounded-full font-medium hover:bg-accent-500 transition-colors shadow-md disabled:opacity-50">
            {saving ? "保存中..." : post ? "更新文章" : "发布文章"}
          </button>
          <button onClick={onCancel} className="px-6 py-2.5 bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full font-medium hover:bg-warm-300 dark:hover:bg-bark-600 transition-colors">取消</button>
        </div>
      </div>
    );
  };

  // ========== 相册编辑器（保持不变，省略大部分） ==========
  const AlbumEditor = ({ album, onSave, onCancel, onRedeploy }: { album: AlbumData | null; onSave: () => void; onCancel: () => void; onRedeploy: () => void }) => {
    const [form, setForm] = useState({
      name: album?.name || "", description: album?.description || "",
      date: album?.date || new Date().toISOString().split("T")[0],
      cover: album?.cover || "", photos: album?.photos || [] as { src: string; caption: string }[],
    });

    // 相册名转 slug
    const generateAlbumSlug = (name: string): string => {
      const parts: string[] = [];
      let remaining = name;
      let found = true;
      while (remaining.length > 0 && found) {
        found = false;
        for (const [cn, en] of Object.entries(slugMap)) {
          if (remaining.startsWith(cn)) {
            parts.push(en);
            remaining = remaining.slice(cn.length);
            found = true;
            break;
          }
        }
      }
      if (parts.length > 0 && remaining.length < name.length * 0.5) {
        if (remaining.length > 0) parts.push(Date.now().toString(36).slice(-4));
        return parts.join("-");
      }
      return `album-${Date.now().toString(36).slice(-6)}`;
    };
    const [slug, setSlug] = useState(album?.slug || "");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!album);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [localMsg, setLocalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const showLocalMsg = (type: "success" | "error", text: string) => { setLocalMsg({ type, text }); setTimeout(() => setLocalMsg(null), 3000); };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files; if (!files) return;
      setUploading(true);
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i], `albums/${slug || "new"}`);
        if (url) setForm((prev) => ({ ...prev, photos: [...prev.photos, { src: url, caption: files[i].name.replace(/\.[^.]+$/, "") }] }));
      }
      setUploading(false); showLocalMsg("success", "照片上传成功！");
    };

    const handleSave = async () => {
      if (!form.name || !slug) { showLocalMsg("error", "相册名称和 slug 不能为空"); return; }
      setSaving(true);
      const albumData = { name: form.name, description: form.description, date: form.date, cover: form.cover || (form.photos.length > 0 ? form.photos[0].src : ""), photos: form.photos };
      const fileContent = yaml.dump(albumData, { lineWidth: -1 });
      const existingAlbum = album ? albums.find((a) => a.slug === slug) : null;
      const success = await saveFile(`content/albums/${slug}.yaml`, fileContent, `${album ? "更新" : "创建"}相册: ${form.name}`, existingAlbum?.sha);
      if (success) { showLocalMsg("success", `相册${album ? "更新" : "创建"}成功！内容已即时更新`); onRedeploy(); onSave(); }
      else { showLocalMsg("error", "保存失败，请重试"); }
      setSaving(false);
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-bark-700 dark:text-warm-100">{album ? "✏️ 编辑相册" : "📷 创建新相册"}</h2>
          <button onClick={onCancel} className="text-bark-400 hover:text-bark-600 transition-colors">取消</button>
        </div>
        {localMsg && (
          <div className={`px-4 py-2.5 rounded-warm-lg text-sm font-medium ${localMsg.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}>{localMsg.text}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">相册名称</label>
            <input value={form.name} onChange={(e) => {
              const newName = e.target.value;
              setForm({ ...form, name: newName });
              if (!slugManuallyEdited && !album) {
                setSlug(newName ? generateAlbumSlug(newName) : "");
              }
            }} className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="如：春日随拍" /></div>
          <div>            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">
              URL Slug {!album && <span className="text-xs text-bark-400 font-normal">（根据名称自动生成，可手动修改）</span>}
            </label>
            <input value={slug} onChange={(e) => { setSlug(e.target.value.replace(/[^a-z0-9-]/g, "")); setSlugManuallyEdited(true); }} className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="auto-generated" disabled={!!album} /></div>
          <div><label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">描述</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="相册描述" /></div>
          <div><label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">日期</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" /></div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200">照片 ({form.photos.length} 张)</label>
            <label className="px-4 py-2 bg-accent-400 text-white rounded-full text-sm cursor-pointer hover:bg-accent-500 transition-colors shadow-md">
              {uploading ? "上传中..." : "📷 添加照片"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
          {form.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {form.photos.map((photo, index) => (
                <div key={index} className="group relative bg-white dark:bg-bark-800 rounded-lg overflow-hidden border border-warm-200 dark:border-bark-600">
                  <div className="aspect-square"><img src={photo.src} alt={photo.caption} className="w-full h-full object-cover" /></div>
                  <div className="p-2"><input value={photo.caption} onChange={(e) => { const np = [...form.photos]; np[index] = { ...np[index], caption: e.target.value }; setForm({ ...form, photos: np }); }}
                    className="w-full px-2 py-1 text-xs bg-warm-50 dark:bg-bark-700 border border-warm-200 dark:border-bark-600 rounded text-bark-600 dark:text-bark-200" placeholder="照片说明" /></div>
                  <button onClick={() => setForm({ ...form, photos: form.photos.filter((_, i) => i !== index) })}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white dark:bg-bark-800 rounded-lg border border-warm-200 dark:border-bark-600">
              <span className="text-3xl block mb-2">📷</span><p className="text-bark-400 dark:text-bark-300 text-sm">还没有照片，点击上方按钮添加</p>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-accent-400 text-white rounded-full font-medium hover:bg-accent-500 transition-colors shadow-md disabled:opacity-50">
            {saving ? "保存中..." : album ? "更新相册" : "创建相册"}</button>
          <button onClick={onCancel} className="px-6 py-2.5 bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full font-medium hover:bg-warm-300 dark:hover:bg-bark-600 transition-colors">取消</button>
        </div>
      </div>
    );
  };

  // ========== 未登录界面 ==========
  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">🌿</span>
          <h1 className="font-serif text-3xl font-bold text-bark-700 dark:text-warm-100 mb-2">管理后台</h1>
          <p className="text-bark-400 dark:text-bark-300">欢迎回来，请登录管理你的小站</p>
        </div>
        <div className="bg-white dark:bg-bark-800 rounded-warm-lg p-6 border border-warm-200 dark:border-bark-700 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-2">用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full px-3 py-2.5 bg-warm-50 dark:bg-bark-700 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="请输入用户名" autoComplete="username" />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-2">密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full px-3 py-2.5 bg-warm-50 dark:bg-bark-700 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="请输入密码" autoComplete="current-password" />
          </div>
          <button onClick={handleLogin} disabled={loading || !username || !password}
            className="w-full py-2.5 bg-accent-400 text-white rounded-full font-medium hover:bg-accent-500 transition-colors shadow-md disabled:opacity-50">
            {loading ? "登录中..." : "登录"}
          </button>
        </div>
      </div>
    );
  }

  // ========== 已登录界面 ==========
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold text-bark-700 dark:text-warm-100">🛠️ 管理后台</h1>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="px-4 py-2 text-sm bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full hover:bg-warm-300 dark:hover:bg-bark-600 transition-colors">🔄 刷新</button>
          <a href="/" className="px-4 py-2 text-sm bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full hover:bg-warm-300 dark:hover:bg-bark-600 transition-colors">🌐 查看网站</a>
          <button onClick={handleLogout} className="px-4 py-2 text-sm bg-warm-200 dark:bg-bark-700 text-red-500 rounded-full hover:bg-warm-300 dark:hover:bg-bark-600 transition-colors">退出</button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-warm-lg text-sm font-medium ${message.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}>{message.text}</div>
      )}

      {/* 主 Tab */}
      {(activeTab === "posts" || activeTab === "albums" || activeTab === "categories" || activeTab === "tags") && (
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setActiveTab("posts")} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "posts" ? "bg-accent-400 text-white shadow-md" : "bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 hover:bg-warm-300"}`}>
            📝 文章 ({posts.length})
          </button>
          <button onClick={() => setActiveTab("albums")} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "albums" ? "bg-accent-400 text-white shadow-md" : "bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 hover:bg-warm-300"}`}>
            📷 相册 ({albums.length})
          </button>
          <button onClick={() => setActiveTab("categories")} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "categories" ? "bg-accent-400 text-white shadow-md" : "bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 hover:bg-warm-300"}`}>
            📂 分类 ({allCategories.length})
          </button>
          <button onClick={() => setActiveTab("tags")} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "tags" ? "bg-accent-400 text-white shadow-md" : "bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 hover:bg-warm-300"}`}>
            🏷️ 标签 ({allTags.length})
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-accent-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-bark-400 dark:text-bark-300">加载中...</p>
        </div>
      )}

      {/* ========== 分类管理 ========== */}
      {activeTab === "categories" && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-bark-700 dark:text-warm-100 flex items-center gap-2">
              📂 分类管理 <span className="text-sm font-normal text-bark-400">({allCategories.length})</span>
            </h2>
          </div>

          {allCategories.length > 0 ? (
            <div className="space-y-3">
              {allCategories.map((cat) => {
                const catPosts = posts.filter((p) => p.category === cat.name);
                return (
                  <div key={cat.name} className="flex items-center justify-between p-4 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700 hover:border-accent-300 dark:hover:border-accent-500 transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="font-serif font-bold text-bark-700 dark:text-warm-100 text-lg">{cat.name}</div>
                      <div className="text-xs text-bark-400 mt-1">{cat.count} 篇文章</div>
                      {catPosts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {catPosts.slice(0, 3).map((p) => (
                            <span key={p.slug} className="text-xs px-2 py-0.5 bg-warm-100 dark:bg-bark-700 text-bark-500 dark:text-bark-300 rounded">
                              {p.title}
                            </span>
                          ))}
                          {catPosts.length > 3 && <span className="text-xs text-bark-400">等 {catPosts.length} 篇</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={async () => {
                          const newName = prompt("请输入新的分类名称：", cat.name);
                          if (!newName || newName === cat.name) return;
                          // 批量更新所有该分类的文章
                          let successCount = 0;
                          for (const post of catPosts) {
                            const frontmatter = {
                              title: post.title,
                              date: post.date,
                              category: newName,
                              tags: post.tags,
                              summary: post.summary,
                              cover: post.cover,
                            };
                            const fileContent = matter.stringify(post.content, frontmatter);
                            const s = await saveFile(`content/posts/${post.slug}.md`, fileContent, `重命名分类: ${cat.name} → ${newName}`, post.sha);
                            if (s) successCount++;
                          }
                          if (successCount > 0) {
                            showMessage("success", `已将 ${successCount} 篇文章的分类从「${cat.name}」改为「${newName}」`);
                            triggerRedeploy();
                            loadData();
                          } else {
                            showMessage("error", "重命名失败，请重试");
                          }
                        }}
                        className="px-3 py-1.5 text-xs bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full hover:bg-warm-300 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`确定删除分类「${cat.name}」吗？\n该操作会将 ${cat.count} 篇文章的分类改为「未分类」`)) return;
                          let successCount = 0;
                          for (const post of catPosts) {
                            const frontmatter = {
                              title: post.title,
                              date: post.date,
                              category: "未分类",
                              tags: post.tags,
                              summary: post.summary,
                              cover: post.cover,
                            };
                            const fileContent = matter.stringify(post.content, frontmatter);
                            const s = await saveFile(`content/posts/${post.slug}.md`, fileContent, `删除分类: ${cat.name}`, post.sha);
                            if (s) successCount++;
                          }
                          if (successCount > 0) {
                            showMessage("success", `已删除分类「${cat.name}」，${successCount} 篇文章已改为「未分类」`);
                            triggerRedeploy();
                            loadData();
                          } else {
                            showMessage("error", "删除失败，请重试");
                          }
                        }}
                        className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full hover:bg-red-200 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700">
              <span className="text-4xl block mb-3">📂</span>
              <p className="text-bark-400 dark:text-bark-300">暂无分类，发布文章时创建</p>
            </div>
          )}
          <p className="text-xs text-bark-400">💡 分类在发布文章时创建和选择。编辑分类名会批量更新所有相关文章；删除分类会将文章改为「未分类」</p>
        </div>
      )}

      {/* ========== 标签管理 ========== */}
      {activeTab === "tags" && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-bark-700 dark:text-warm-100 flex items-center gap-2">
              🏷️ 标签管理 <span className="text-sm font-normal text-bark-400">({allTags.length})</span>
            </h2>
            <button
              onClick={async () => {
                const name = prompt("请输入新标签名称：");
                if (!name || !name.trim()) return;
                const trimmed = name.trim();
                if (allTags.some((t) => t.name === trimmed)) {
                  showMessage("error", `标签「${trimmed}」已存在`);
                  return;
                }
                // 新标签只需在前端可用即可，发布文章时选择就会自动保存
                showMessage("success", `标签「${trimmed}」已创建，发布文章时即可选择`);
              }}
              className="px-5 py-2.5 bg-accent-400 text-white rounded-full font-medium hover:bg-accent-500 transition-colors shadow-md text-sm"
            >
              + 新建标签
            </button>
          </div>

          {allTags.length > 0 ? (
            <div className="space-y-3">
              {allTags.map((tag) => {
                const tagPosts = posts.filter((p) => p.tags.includes(tag.name));
                return (
                  <div key={tag.name} className="flex items-center justify-between p-4 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700 hover:border-accent-300 dark:hover:border-accent-500 transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-bark-700 dark:text-warm-100 text-lg">#{tag.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-accent-100 dark:bg-accent-700/30 text-accent-500 dark:text-accent-300 rounded-full">{tag.count} 篇</span>
                      </div>
                      {tagPosts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {tagPosts.slice(0, 3).map((p) => (
                            <span key={p.slug} className="text-xs px-2 py-0.5 bg-warm-100 dark:bg-bark-700 text-bark-500 dark:text-bark-300 rounded">
                              {p.title}
                            </span>
                          ))}
                          {tagPosts.length > 3 && <span className="text-xs text-bark-400">等 {tagPosts.length} 篇</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={async () => {
                          const newName = prompt("请输入新的标签名称：", tag.name);
                          if (!newName || newName === tag.name || !newName.trim()) return;
                          const trimmed = newName.trim();
                          // 批量更新所有包含该标签的文章
                          let successCount = 0;
                          for (const post of tagPosts) {
                            const newTags = post.tags.map((t) => (t === tag.name ? trimmed : t));
                            const frontmatter = {
                              title: post.title,
                              date: post.date,
                              category: post.category,
                              tags: newTags,
                              summary: post.summary,
                              cover: post.cover,
                            };
                            const fileContent = matter.stringify(post.content, frontmatter);
                            const s = await saveFile(`content/posts/${post.slug}.md`, fileContent, `重命名标签: ${tag.name} → ${trimmed}`, post.sha);
                            if (s) successCount++;
                          }
                          if (successCount > 0) {
                            showMessage("success", `已将 ${successCount} 篇文章的标签从「${tag.name}」改为「${trimmed}」`);
                            triggerRedeploy();
                            loadData();
                          } else {
                            showMessage("error", "重命名失败，请重试");
                          }
                        }}
                        className="px-3 py-1.5 text-xs bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full hover:bg-warm-300 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`确定删除标签「${tag.name}」吗？\n该操作会从 ${tag.count} 篇文章中移除此标签`)) return;
                          let successCount = 0;
                          for (const post of tagPosts) {
                            const newTags = post.tags.filter((t) => t !== tag.name);
                            const frontmatter = {
                              title: post.title,
                              date: post.date,
                              category: post.category,
                              tags: newTags,
                              summary: post.summary,
                              cover: post.cover,
                            };
                            const fileContent = matter.stringify(post.content, frontmatter);
                            const s = await saveFile(`content/posts/${post.slug}.md`, fileContent, `删除标签: ${tag.name}`, post.sha);
                            if (s) successCount++;
                          }
                          if (successCount > 0) {
                            showMessage("success", `已删除标签「${tag.name}」，从 ${successCount} 篇文章中移除`);
                            triggerRedeploy();
                            loadData();
                          } else {
                            showMessage("error", "删除失败，请重试");
                          }
                        }}
                        className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full hover:bg-red-200 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700">
              <span className="text-4xl block mb-3">🏷️</span>
              <p className="text-bark-400 dark:text-bark-300">暂无标签，发布文章时创建或点击右上角新建</p>
            </div>
          )}
          <p className="text-xs text-bark-400">💡 标签在发布文章时创建和选择。编辑标签名会批量更新所有相关文章；删除标签会从所有文章中移除该标签</p>
        </div>
      )}

      {/* ========== 文章列表 ========== */}
      {activeTab === "posts" && !loading && (
        <div>
          <button onClick={() => { setEditingPost(null); setActiveTab("new-post"); }}
            className="mb-6 px-5 py-2.5 bg-accent-400 text-white rounded-full font-medium hover:bg-accent-500 transition-colors shadow-md">
            ✍️ 发布新文章
          </button>
          {posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.slug} className="flex items-center justify-between p-4 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700 hover:border-accent-300 dark:hover:border-accent-500 transition-all">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-bark-700 dark:text-warm-100 truncate">{post.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-accent-100 dark:bg-accent-700/30 text-accent-500 dark:text-accent-300 rounded-full">{post.category}</span>
                      <span className="text-xs text-bark-400">{post.date}</span>
                      {post.tags.map((tag) => (<span key={tag} className="text-xs text-bark-400">#{tag}</span>))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <a href={`/blog/${post.slug}`} target="_blank" className="px-3 py-1.5 text-xs bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full hover:bg-warm-300 transition-colors">查看</a>
                    <button onClick={() => { setEditingPost(post); setActiveTab("edit-post"); }} className="px-3 py-1.5 text-xs bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full hover:bg-warm-300 transition-colors">编辑</button>
                    <button onClick={async () => { if (confirm(`确定删除「${post.title}」吗？`)) { const s = await deleteFile(`content/posts/${post.slug}.md`, `删除文章: ${post.title}`, post.sha); if (s) { showMessage("success", "文章已删除，内容已即时更新"); triggerRedeploy(); loadData(); } else showMessage("error", "删除失败"); } }}
                      className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full hover:bg-red-200 transition-colors">删除</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700">
              <span className="text-4xl block mb-3">📝</span><p className="text-bark-400 dark:text-bark-300">暂无文章</p>
            </div>
          )}
        </div>
      )}

      {/* ========== 相册列表 ========== */}
      {activeTab === "albums" && !loading && (
        <div>
          <button onClick={() => { setEditingAlbum(null); setActiveTab("new-album"); }}
            className="mb-6 px-5 py-2.5 bg-accent-400 text-white rounded-full font-medium hover:bg-accent-500 transition-colors shadow-md">
            📷 创建新相册
          </button>
          {albums.length > 0 ? (
            <div className="space-y-3">
              {albums.map((album) => (
                <div key={album.slug} className="flex items-center justify-between p-4 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700 hover:border-accent-300 dark:hover:border-accent-500 transition-all">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-bark-700 dark:text-warm-100">{album.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-bark-400">{album.photos.length} 张照片</span>
                      <span className="text-xs text-bark-400">{album.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <a href={`/albums/${album.slug}`} target="_blank" className="px-3 py-1.5 text-xs bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full hover:bg-warm-300 transition-colors">查看</a>
                    <button onClick={() => { setEditingAlbum(album); setActiveTab("edit-album"); }} className="px-3 py-1.5 text-xs bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full hover:bg-warm-300 transition-colors">编辑</button>
                    <button onClick={async () => { if (confirm(`确定删除「${album.name}」吗？`)) { const s = await deleteFile(`content/albums/${album.slug}.yaml`, `删除相册: ${album.name}`, album.sha); if (s) { showMessage("success", "相册已删除，内容已即时更新"); triggerRedeploy(); loadData(); } else showMessage("error", "删除失败"); } }}
                      className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full hover:bg-red-200 transition-colors">删除</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700">
              <span className="text-4xl block mb-3">📷</span><p className="text-bark-400 dark:text-bark-300">暂无相册</p>
            </div>
          )}
        </div>
      )}

      {(activeTab === "new-post" || activeTab === "edit-post") && !loading && (
        <PostEditor post={activeTab === "edit-post" ? editingPost : null} onSave={() => { setActiveTab("posts"); loadData(); }} onCancel={() => setActiveTab("posts")} onRedeploy={triggerRedeploy} />
      )}
      {(activeTab === "new-album" || activeTab === "edit-album") && !loading && (
        <AlbumEditor album={activeTab === "edit-album" ? editingAlbum : null} onSave={() => { setActiveTab("albums"); loadData(); }} onCancel={() => setActiveTab("albums")} onRedeploy={triggerRedeploy} />
      )}
    </div>
  );
}
