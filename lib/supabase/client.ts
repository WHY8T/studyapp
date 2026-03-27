import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,     // ✅ keeps session alive when app is closed
        autoRefreshToken: true,   // ✅ auto-refreshes before expiry
        detectSessionInUrl: true, // ✅ handles magic link / OAuth callbacks
      },
    }
  );
}