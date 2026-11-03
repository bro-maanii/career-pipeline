const PUBLIC_AUTH_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/auth/confirm",
]);
export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.has(pathname);
}
export function signupValidation(
  password: string,
  confirmation: string,
): string | null {
  if (password.length < 8) return "Use a password with at least 8 characters.";
  if (password !== confirmation) return "Your passwords do not match.";
  return null;
}
export function emailCallbackPath(
  url: Pick<URL, "pathname" | "searchParams">,
): string | null {
  // Supabase can fall back to the configured Site URL. Keep the PKCE code
  // on a public callback route before the workspace's login redirect runs.
  if (url.pathname !== "/") return null;
  const code = url.searchParams.get("code");
  if (code) return `/auth/callback?${new URLSearchParams({ code })}`;
  if (url.searchParams.has("error")) return "/login?notice=confirmation-failed";
  return null;
}
export function isSameOriginJsonRequest(
  request: Pick<Request, "headers">,
  expectedOrigin: string,
): boolean {
  const type = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  const origin = request.headers.get("origin");
  return type === "application/json" && (!origin || origin === expectedOrigin);
}
