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

type Tab = "posts" | "albums" | "categories" | "new-post" | "edit-post" | "new-album" | "edit-album";

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

  // ========== 文章编辑器 ==========
  const PostEditor = ({ post, onSave, onCancel }: { post: PostData | null; onSave: () => void; onCancel: () => void }) => {
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
      if (!form.title || !slug) { showMessage("error", "标题和 slug 不能为空"); return; }
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
        showMessage("success", `文章${post ? "更新" : "发布"}成功！网站将自动部署`);
        onSave();
      } else {
        showMessage("error", "保存失败，请重试");
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
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="输入文章标题" />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">URL Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
              className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="url-slug" disabled={!!post} />
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
  const AlbumEditor = ({ album, onSave, onCancel }: { album: AlbumData | null; onSave: () => void; onCancel: () => void }) => {
    const [form, setForm] = useState({
      name: album?.name || "", description: album?.description || "",
      date: album?.date || new Date().toISOString().split("T")[0],
      cover: album?.cover || "", photos: album?.photos || [] as { src: string; caption: string }[],
    });
    const [slug, setSlug] = useState(album?.slug || "");
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
      if (!form.name || !slug) { showMessage("error", "相册名称和 slug 不能为空"); return; }
      setSaving(true);
      const albumData = { name: form.name, description: form.description, date: form.date, cover: form.cover || (form.photos.length > 0 ? form.photos[0].src : ""), photos: form.photos };
      const fileContent = yaml.dump(albumData, { lineWidth: -1 });
      const existingAlbum = album ? albums.find((a) => a.slug === slug) : null;
      const success = await saveFile(`content/albums/${slug}.yaml`, fileContent, `${album ? "更新" : "创建"}相册: ${form.name}`, existingAlbum?.sha);
      if (success) { showMessage("success", `相册${album ? "更新" : "创建"}成功！网站将自动部署`); onSave(); }
      else { showMessage("error", "保存失败，请重试"); }
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
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="如：春日随拍" /></div>
          <div><label className="block text-sm font-medium text-bark-600 dark:text-bark-200 mb-1">URL Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))} className="w-full px-3 py-2 bg-white dark:bg-bark-800 border border-warm-200 dark:border-bark-600 rounded-lg text-bark-700 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="url-slug" disabled={!!album} /></div>
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
      {(activeTab === "posts" || activeTab === "albums" || activeTab === "categories") && (
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setActiveTab("posts")} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "posts" ? "bg-accent-400 text-white shadow-md" : "bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 hover:bg-warm-300"}`}>
            📝 文章 ({posts.length})
          </button>
          <button onClick={() => setActiveTab("albums")} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "albums" ? "bg-accent-400 text-white shadow-md" : "bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 hover:bg-warm-300"}`}>
            📷 相册 ({albums.length})
          </button>
          <button onClick={() => setActiveTab("categories")} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "categories" ? "bg-accent-400 text-white shadow-md" : "bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 hover:bg-warm-300"}`}>
            🏷️ 分类标签
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-accent-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-bark-400 dark:text-bark-300">加载中...</p>
        </div>
      )}

      {/* ========== 分类标签管理 ========== */}
      {activeTab === "categories" && !loading && (
        <div className="space-y-8">
          {/* 分类 */}
          <div>
            <h2 className="font-serif text-xl font-bold text-bark-700 dark:text-warm-100 mb-4 flex items-center gap-2">
              📂 分类 <span className="text-sm font-normal text-bark-400">({allCategories.length})</span>
            </h2>
            {allCategories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {allCategories.map((cat) => (
                  <div key={cat.name} className="p-4 bg-white dark:bg-bark-800 rounded-warm-lg border border-warm-200 dark:border-bark-700 hover:border-accent-300 dark:hover:border-accent-500 transition-all cursor-pointer"
                    onClick={() => { setEditingPost(null); setActiveTab("posts"); }}>
                    <div className="font-serif font-bold text-bark-700 dark:text-warm-100">{cat.name}</div>
                    <div className="text-xs text-bark-400 mt-1">{cat.count} 篇文章</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-bark-400 dark:text-bark-300">暂无分类，发布文章时创建</p>
            )}
            <p className="text-xs text-bark-400 mt-3">💡 分类在发布文章时创建和选择，点击分类可跳转到文章列表</p>
          </div>

          {/* 标签 */}
          <div>
            <h2 className="font-serif text-xl font-bold text-bark-700 dark:text-warm-100 mb-4 flex items-center gap-2">
              🏷️ 标签 <span className="text-sm font-normal text-bark-400">({allTags.length})</span>
            </h2>
            {allTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <span key={tag.name} className="px-4 py-2 bg-warm-200 dark:bg-bark-700 text-bark-600 dark:text-bark-200 rounded-full text-sm font-medium hover:bg-accent-100 dark:hover:bg-accent-700/30 hover:text-accent-500 transition-colors">
                    #{tag.name} <span className="text-xs opacity-60">({tag.count})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-bark-400 dark:text-bark-300">暂无标签，发布文章时创建</p>
            )}
            <p className="text-xs text-bark-400 mt-3">💡 标签在发布文章时创建和选择，可多选</p>
          </div>
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
                    <button onClick={async () => { if (confirm(`确定删除「${post.title}」吗？`)) { const s = await deleteFile(`content/posts/${post.slug}.md`, `删除文章: ${post.title}`, post.sha); if (s) { showMessage("success", "文章已删除"); loadData(); } else showMessage("error", "删除失败"); } }}
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
                    <button onClick={async () => { if (confirm(`确定删除「${album.name}」吗？`)) { const s = await deleteFile(`content/albums/${album.slug}.yaml`, `删除相册: ${album.name}`, album.sha); if (s) { showMessage("success", "相册已删除"); loadData(); } else showMessage("error", "删除失败"); } }}
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
        <PostEditor post={activeTab === "edit-post" ? editingPost : null} onSave={() => { setActiveTab("posts"); loadData(); }} onCancel={() => setActiveTab("posts")} />
      )}
      {(activeTab === "new-album" || activeTab === "edit-album") && !loading && (
        <AlbumEditor album={activeTab === "edit-album" ? editingAlbum : null} onSave={() => { setActiveTab("albums"); loadData(); }} onCancel={() => setActiveTab("albums")} />
      )}
    </div>
  );
}
