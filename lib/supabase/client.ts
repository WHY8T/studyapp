import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,        // ✅ keeps session on mobile after app close
        autoRefreshToken: true,       // ✅ auto-refresh before expiry
        storageKey: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_KEY, // "nahda-edu-auth"
        detectSessionInUrl: true,
      },
    }
  );
}