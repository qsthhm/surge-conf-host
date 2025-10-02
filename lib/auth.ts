import { NextRequest, NextResponse } from "next/server";

const PASSWORD = process.env.APP_PASSWORD || "";
const URL_TOKEN = process.env.URL_TOKEN || "";

export async function verifyPassword(input: string) {
  const a = Buffer.from(PASSWORD);
  const b = Buffer.from(input || "");
  const len = Math.max(a.length, b.length);
  const pa = Buffer.concat([a, Buffer.alloc(len - a.length)]);
  const pb = Buffer.concat([b, Buffer.alloc(len - b.length)]);
  return Buffer.compare(pa, pb) === 0;
}

export function requireAuth(req: NextRequest): NextResponse | null {
  const session = req.cookies.get("session")?.value;
  if (!session) return new NextResponse("未授权", { status: 401 });

  const url = new URL(req.url);
  const seg = url.pathname.split("/").filter(Boolean);
  const tokenFromPath = seg[0] || "";
  if (URL_TOKEN && tokenFromPath !== URL_TOKEN) {
    return new NextResponse("无效令牌", { status: 403 });
  }
  return null;
}
