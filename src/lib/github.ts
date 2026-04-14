// GitHub API 操作工具

const GITHUB_API = "https://api.github.com";

interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

function getConfig(): GitHubConfig {
  if (typeof window === "undefined") {
    return { owner: "congcong-git", repo: "workbuddyspace", branch: "main", token: "" };
  }
  const stored = sessionStorage.getItem("github_token") || localStorage.getItem("github_token");
  return {
    owner: "congcong-git",
    repo: "workbuddyspace",
    branch: "main",
    token: stored || "",
  };
}

function headers(token: string) {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

// UTF-8 安全的 base64 解码
function decodeBase64UTF8(base64: string): string {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

// UTF-8 安全的 base64 编码
function encodeBase64UTF8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 获取文件内容
export async function getFileContent(path: string): Promise<{ content: string; sha: string } | null> {
  const config = getConfig();
  if (!config.token) return null;

  const res = await fetch(
    `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
    { headers: headers(config.token) }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API 错误: ${res.status}`);

  const data = await res.json();
  return {
    content: decodeBase64UTF8(data.content),
    sha: data.sha,
  };
}

// 获取目录列表
export async function getDirectoryList(path: string): Promise<{ name: string; path: string; sha: string }[]> {
  const config = getConfig();
  if (!config.token) return [];

  const res = await fetch(
    `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
    { headers: headers(config.token) }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data
    .filter((item: { type: string }) => item.type === "file")
    .map((item: { name: string; path: string; sha: string }) => ({
      name: item.name,
      path: item.path,
      sha: item.sha,
    }));
}

// 创建或更新文件（更新时自动获取最新 sha）
export async function saveFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<boolean> {
  const config = getConfig();
  if (!config.token) return false;

  const body: Record<string, string> = {
    message,
    content: encodeBase64UTF8(content),
    branch: config.branch,
  };

  // 如果是更新操作（提供了 sha），先获取最新 sha 防止因 force push 导致 sha 失效
  if (sha) {
    const latest = await getFileContent(path);
    if (latest) {
      body.sha = latest.sha;
    } else {
      body.sha = sha; // 文件不存在时用传入的 sha（可能文件已被删除，用旧 sha 会创建新文件）
    }
  }

  const res = await fetch(
    `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(config.token),
      body: JSON.stringify(body),
    }
  );

  return res.ok;
}

// 删除文件（先获取最新 sha）
export async function deleteFile(path: string, message: string, _sha?: string): Promise<boolean> {
  const config = getConfig();
  if (!config.token) return false;

  // 先获取最新 sha（因为 force push 可能导致旧 sha 失效）
  const latest = await getFileContent(path);
  if (!latest) return false; // 文件不存在，可能已被删除

  const res = await fetch(
    `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${path}`,
    {
      method: "DELETE",
      headers: headers(config.token),
      body: JSON.stringify({ message, sha: latest.sha, branch: config.branch }),
    }
  );

  return res.ok;
}

// 上传图片到 public/images/
export async function uploadImage(
  file: File,
  directory: string
): Promise<string | null> {
  const config = getConfig();
  if (!config.token) return null;

  const path = `public/images/${directory}/${file.name}`;
  const content = await fileToBase64(file);

  const res = await fetch(
    `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(config.token),
      body: JSON.stringify({
        message: `上传图片: ${file.name}`,
        content,
        branch: config.branch,
      }),
    }
  );

  if (!res.ok) return null;
  return `/images/${directory}/${file.name}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 验证 Token 是否有效
export async function validateToken(token: string): Promise<boolean> {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: headers(token),
  });
  return res.ok;
}

// 保存 Token 到 localStorage
export function saveToken(token: string) {
  localStorage.setItem("github_token", token);
}

// 获取 Token
export function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("github_token") || "";
}

// 清除 Token
export function clearToken() {
  localStorage.removeItem("github_token");
}
