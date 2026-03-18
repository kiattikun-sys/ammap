import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/supabase-middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/projects"];
const AUTH_PAGES = ["/login", "/signup", "/register"];
const SKIP_REDIRECT_PAGES = ["/set-password", "/auth/callback"];

// Matches /{uuid}/{anything} — project-scoped routes
const PROJECT_ROUTE_RE = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i;

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    PROJECT_ROUTE_RE.test(pathname);

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isSkipped = SKIP_REDIRECT_PAGES.some((p) => pathname.startsWith(p));

  if (isSkipped) return response;

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
