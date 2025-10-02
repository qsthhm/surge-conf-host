import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { readCurrent, writeCurrent, readVersions, rollbackTo } from "@/lib/store";

// 读取当前内容 + 版本列表
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const content = await readCurrent();
  return NextResponse.json({ content, versions: await readVersions() });
}

// 文本编辑保存 & 回滚（JSON）
export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const body = await req.json().catch(() => null);

  if (typeof body?.rollbackTo === "string") {
    await rollbackTo(body.rollbackTo);
    return NextResponse.json({ ok: true, rolledBackTo: body.rollbackTo });
  }
  if (typeof body?.content === "string") {
    await writeCurrent(body.content);
    return NextResponse.json({ ok: true });
  }
  return new NextResponse("参数错误", { status: 400 });
}

// 新增：上传本地 .conf 文件（multipart/form-data）
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return new NextResponse("缺少 file 字段", { status: 400 });
  }
  const text = await file.text();

  // 简单大小限制（可按需调整）
  const size = new Blob([text]).size;
  if (size > 1024 * 1024) {
    return new NextResponse("文件过大（>1MB）", { status: 413 });
  }

  await writeCurrent(text);
  return NextResponse.json({ ok: true, size });
}
