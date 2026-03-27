import { createBrowserClient } from "@supabase/ssr";

// Custom storage adapter that uses localStorage instead of cookies.
// Mobile browsers (Safari/Chrome on iOS & Android) aggressively clear cookies
// when switching apps, which signs the user out. localStorage persists longer.
const localStorageAdapter = {
  getItem: (key: string) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorageAdapter, // ✅ survives app switching on mobile
      },
    }
  );
}