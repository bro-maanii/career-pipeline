import { LoginForm } from "@/components/login-form";
import { supabaseConfig } from "@/lib/supabase/config";
export default function LoginPage() {
  return <LoginForm configured={!!supabaseConfig()} />;
}
