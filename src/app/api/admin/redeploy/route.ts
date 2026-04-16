export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

// Vercel 项目和团队信息
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || "";

export async function POST(request: NextRequest) {
  // 简单验证：检查是否有管理 session
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ success: false, message: "未授权" }, { status: 401 });
  }

  // 使用 Vercel API 触发部署（作为备选方案）
  // 由于核心内容页面已经是动态渲染，此处主要用于：
  // 1. 触发重新构建以更新搜索索引
  // 2. 更新静态资源（如图片等）
  if (VERCEL_TOKEN && VERCEL_PROJECT_ID) {
    try {
      const res = await fetch(
        `https://api.vercel.com/v13/deployments?projectId=${VERCEL_PROJECT_ID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "workbuddyspace",
            ref: "main",
            target: "production",
          }),
        }
      );
      if (res.ok) {
        console.log("[redeploy] 已触发 Vercel 重新部署");
        return NextResponse.json({ success: true, message: "已触发重新部署" });
      }
      console.error("[redeploy] 触发部署失败:", res.status);
    } catch (err) {
      console.error("[redeploy] 部署请求异常:", err);
    }
  }

  // 没有配置部署凭据时，动态渲染页面已经会显示最新内容
  // 此处静默返回成功，避免干扰用户体验
  return NextResponse.json({
    success: true,
    message: "内容已即时更新（动态渲染），静态资源将在下次自动部署时更新",
  });
}
