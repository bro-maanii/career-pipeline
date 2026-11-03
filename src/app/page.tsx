import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing-page";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  return <LandingPage member={Boolean(data.user)} />;
}
