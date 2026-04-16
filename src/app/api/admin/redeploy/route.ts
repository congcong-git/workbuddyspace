export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

// Vercel Deploy Hook URL（在 Vercel 项目设置中创建）
// 格式: https://api.vercel.com/v1/integrations/deploy/xxx
const VERCEL_DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK || "";

export async function POST(request: NextRequest) {
  // 简单验证：检查是否有管理 session
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ success: false, message: "未授权" }, { status: 401 });
  }

  if (!VERCEL_DEPLOY_HOOK) {
    // 没有 deploy hook 时静默返回成功（不影响用户体验）
    console.log("[redeploy] 未配置 VERCEL_DEPLOY_HOOK，跳过自动部署");
    return NextResponse.json({ success: true, message: "未配置部署钩子，内容将在下次部署时更新" });
  }

  try {
    const res = await fetch(VERCEL_DEPLOY_HOOK, { method: "POST" });
    if (res.ok) {
      console.log("[redeploy] 已触发 Vercel 重新部署");
      return NextResponse.json({ success: true, message: "已触发重新部署，约1-2分钟后生效" });
    } else {
      console.error("[redeploy] 触发部署失败:", res.status);
      return NextResponse.json({ success: false, message: "触发部署失败" }, { status: 500 });
    }
  } catch (err) {
    console.error("[redeploy] 部署请求异常:", err);
    return NextResponse.json({ success: false, message: "部署请求异常" }, { status: 500 });
  }
}
