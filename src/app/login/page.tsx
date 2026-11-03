import { LoginForm } from "@/components/login-form";
import { supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/");
  }
  const params = await searchParams;
  const notice =
    params.notice === "confirmation-failed"
      ? "This confirmation link is invalid or has expired. Try signing in if you already confirmed your email, or create your account again to request a fresh link."
      : "";
  return <LoginForm configured={!!supabaseConfig()} notice={notice} />;
}
