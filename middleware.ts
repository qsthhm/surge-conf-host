import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 只保护 dashboard 页面和 file API
  const match = pathname.match(/^\/([^/]+)\/(dashboard|api\/file)/);
  if (match) {
    const hasSession = !!req.cookies.get("session")?.value;
    if (!hasSession) {
      // 未登录，跳回首页登录页
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// 对所有路径启用中间件，但逻辑只拦截 dashboard/file
export const config = {
  matcher: ["/:path*"],
};
