import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const sid = req.cookies.get("sid")?.value;
  if (req.nextUrl.pathname.startsWith("/dashboard") && !sid) {
    return NextResponse.redirect("http://localhost:3000/auth/twitch/login");
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
