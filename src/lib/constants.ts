// 站点配置
export const siteConfig = {
  name: "聪聪的小站",
  description: "一个温暖文艺的个人博客，记录生活、技术与思考",
  url: "https://workbuddyspace.vercel.app",
  author: {
    name: "聪聪",
    avatar: "/images/avatar.jpg",
    bio: "热爱生活，热爱技术，用文字和镜头记录世界",
  },
  nav: [
    { label: "首页", href: "/" },
    { label: "博客", href: "/blog" },
    { label: "相册", href: "/albums" },
    { label: "关于", href: "/about" },
    { label: "管理", href: "/admin" },
  ],
  postsPerPage: 8,
  giscus: {
    repo: "" as string,
    repoId: "" as string,
    category: "Announcements" as string,
    categoryId: "" as string,
  },
  github: {
    owner: "congcong-git",
    repo: "workbuddyspace",
    branch: "main",
    token: "" as string, // 从 localStorage 读取
  },
};
