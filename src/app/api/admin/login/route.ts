export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

// 管理员账号密码（可修改为你自己的）
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "congcong";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "workbuddy2026";

// GitHub Token 从环境变量读取
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString("base64");
    return NextResponse.json({
      success: true,
      sessionToken,
      githubToken: GITHUB_TOKEN,
    });
  }

  return NextResponse.json({ success: false, message: "用户名或密码错误" }, { status: 401 });
}
