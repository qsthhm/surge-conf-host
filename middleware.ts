// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // 需要会话的路径： /:token/dashboard 和 /:token/api/file
  const match = pathname.match(/^\/([^/]+)\/(dashboard|api\/file)/);
  if (match) {
    const hasSession = !!req.cookies.get("session")?.value;
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = `/${match[1]}`; // 回到对应 token 的登录页
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  // 其余都放行（不再从 / 重定向到 token）
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
