import { LoginForm } from "@/components/login-form";
import { supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export default async function SignupPage() {
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/today");
  }
  return <LoginForm configured={!!supabaseConfig()} mode="signup" />;
}
