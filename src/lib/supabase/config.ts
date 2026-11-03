export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (
    !url ||
    !key ||
    url.includes("your-project") ||
    key === "your-supabase-anon-key"
  )
    return null;
  return { url, key };
}
