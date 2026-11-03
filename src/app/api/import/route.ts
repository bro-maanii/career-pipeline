import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginJsonRequest } from "@/lib/auth";
export async function POST(request: NextRequest) {
  if (!isSameOriginJsonRequest(request, request.nextUrl.origin))
    return NextResponse.json(
      { error: "Invalid request origin or content type." },
      { status: 403 },
    );
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Workspace is not configured." },
      { status: 503 },
    );
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user)
    return NextResponse.json(
      { error: "Sign in before importing." },
      { status: 401 },
    );
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid import request." },
      { status: 400 },
    );
  }
  if (
    !input ||
    typeof input !== "object" ||
    !("expectedUserId" in input) ||
    input.expectedUserId !== data.user.id
  ) {
    return NextResponse.json(
      {
        error:
          "Your account changed. Reopen the import preview in your current account.",
      },
      { status: 403 },
    );
  }
  const bundle = "bundle" in input ? input.bundle : null;
  if (
    !bundle ||
    typeof bundle !== "object" ||
    Array.isArray(bundle) ||
    !["applications", "contacts", "interviews", "daily_logs"].every(
      (key) =>
        key in bundle && Array.isArray(bundle[key as keyof typeof bundle]),
    )
  ) {
    return NextResponse.json(
      { error: "Invalid import data." },
      { status: 400 },
    );
  }
  // Request cookies bind the RPC to this verified user. Later browser account
  // changes cannot change the tenant for an import already in progress.
  const { error: importError } = await supabase.rpc("import_tracker_bundle", {
    payload: bundle,
  });
  if (importError)
    return NextResponse.json({ error: importError.message }, { status: 400 });
  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
