import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    // ✅ No custom options — let @supabase/ssr handle cookies automatically
    // The custom storageKey was breaking cookie sync between client and middleware
  );
}