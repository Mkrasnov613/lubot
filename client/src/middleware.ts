import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const sid = req.cookies.get("sid")?.value;
  if (
    (req.nextUrl.pathname.includes("/dashboard") ||
      req.nextUrl.pathname.includes("/music") ||
      req.nextUrl.pathname.includes("/bot")) &&
    !sid
  ) {
    return NextResponse.redirect("http://localhost:3001");
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
