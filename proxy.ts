// proxy.ts
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { createServerClient } from "@supabase/ssr";
import { hasEnvVars } from "@/lib/utils";

const PROTECTED_ROUTES = ["/homepage"];
const ADMIN_ROUTES = ["/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isAdmin = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    return await updateSession(request);
  }

  if (isAdmin) {
    if (!hasEnvVars) {
      return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options as object)
            );
          },
        },
      }
    );

    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.sub)
      .single();

    if (roleData?.role !== "admin") {
     return NextResponse.redirect(new URL("/not-found", request.url));
    }

    return supabaseResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};