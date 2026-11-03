import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { isPublicAuthPath, emailCallbackPath } from "@/lib/auth";
export async function proxy(request: NextRequest) {
  const config = supabaseConfig();
  const isPublic = isPublicAuthPath(request.nextUrl.pathname);
  const callback = emailCallbackPath(request.nextUrl);
  if (callback && request.method === "GET") {
    const response = NextResponse.redirect(new URL(callback, request.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  if (!config)
    return isPublic
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.url));
  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const { data, error } = await supabase.auth.getUser();
  if ((error || !data.user) && !isPublic) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      const unauthorized = NextResponse.json(
        { error: "Sign in to access your workspace." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
      response.cookies
        .getAll()
        .forEach((cookie) => unauthorized.cookies.set(cookie));
      return unauthorized;
    }
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
