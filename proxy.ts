import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Routes that require authentication
const PROTECTED_ROUTES = ["/homepage"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run Supabase session refresh + auth guard on protected routes
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    return await updateSession(request);
  }

  // All other routes (login, sign-up, forgot-password, etc.) pass through freely
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};