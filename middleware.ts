import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const adminSecret    = new TextEncoder().encode(process.env.JWT_SECRET!);
const creatorSecret  = new TextEncoder().encode(process.env.CREATORS_JWT_SECRET!);
const artistSecret   = new TextEncoder().encode(process.env.ARTISTS_JWT_SECRET!);
const streamerSecret = new TextEncoder().encode(process.env.STREAMERS_JWT_SECRET!);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const token = req.cookies.get("admin_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));
    try { await jwtVerify(token, adminSecret); return NextResponse.next(); }
    catch { return NextResponse.redirect(new URL("/admin/login", req.url)); }
  }

  if (pathname.startsWith("/creators")) {
    if (pathname === "/creators/login") return NextResponse.next();
    const token = req.cookies.get("creator_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/creators/login", req.url));
    try { await jwtVerify(token, creatorSecret); return NextResponse.next(); }
    catch { return NextResponse.redirect(new URL("/creators/login", req.url)); }
  }

  if (pathname.startsWith("/artists-portal")) {
    if (pathname === "/artists-portal/login") return NextResponse.next();
    const token = req.cookies.get("artist_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/artists-portal/login", req.url));
    try { await jwtVerify(token, artistSecret); return NextResponse.next(); }
    catch { return NextResponse.redirect(new URL("/artists-portal/login", req.url)); }
  }

  if (pathname.startsWith("/streamers-portal")) {
    if (pathname === "/streamers-portal/login") return NextResponse.next();
    const token = req.cookies.get("streamer_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/streamers-portal/login", req.url));
    try { await jwtVerify(token, streamerSecret); return NextResponse.next(); }
    catch { return NextResponse.redirect(new URL("/streamers-portal/login", req.url)); }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/creators/:path*", "/artists-portal/:path*", "/streamers-portal/:path*"],
};