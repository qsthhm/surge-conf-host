// app/[token]/api/file/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  readCurrent, writeCurrent, readVersions, rollbackTo,
  deleteVersion, sha256Of
} from "@/lib/store";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const content = await readCurrent();
  const versions = await readVersions();
  const currentSha = sha256Of(content);
  return NextResponse.json({ content, versions, currentSha });
}

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

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return new NextResponse("缺少 file 字段", { status: 400 });
  const text = await file.text();

  if (new Blob([text]).size > 1024 * 1024) return new NextResponse("文件过大（>1MB）", { status: 413 });

  await writeCurrent(text);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const sha = searchParams.get("sha") || "";
  if (!sha) return new NextResponse("缺少 sha", { status: 400 });

  try {
    await deleteVersion(sha);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new NextResponse(e?.message || "删除失败", { status: 400 });
  }
}
