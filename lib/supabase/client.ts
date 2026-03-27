import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,        // ✅ keeps session on mobile after app close
        autoRefreshToken: true,       // ✅ auto-refresh before expiry
        storageKey: "nahda-edu-auth",// "nahda-edu-auth"
        detectSessionInUrl: true,
      },
    }
  );
}