import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = process.env.URL_TOKEN || "";
  if (req.nextUrl.pathname === "/" && token) {
    const url = req.nextUrl.clone();
    url.pathname = `/${token}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
