import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { limitLogin } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const limited = await limitLogin(ip);
  if (!limited.ok) return new NextResponse(limited.message, { status: 429 });

  const { password } = await req.json();
  const ok = await verifyPassword(password);
  if (!ok) return new NextResponse("密码错误", { status: 401 });

  const token = process.env.URL_TOKEN || "";
  const res = NextResponse.json({ ok: true, redirectTo: `/${token}/dashboard` });
  res.cookies.set({
    name: "session",
    value: "1",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
    maxAge: 2 * 60 * 60,
  });
  return res;
}
