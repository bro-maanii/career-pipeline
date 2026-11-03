import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "./config";
export function createClient() {
  const config = supabaseConfig();
  if (!config)
    throw new Error(
      "Add your Supabase URL and anon key to .env.local, then restart the dev server.",
    );
  return createBrowserClient(config.url, config.key);
}
