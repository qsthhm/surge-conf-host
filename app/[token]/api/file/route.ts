import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { readCurrent, writeCurrent, readVersions, rollbackTo } from "@/lib/store";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const content = await readCurrent();
  return NextResponse.json({ content, versions: await readVersions() });
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const body = await req.json();
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
