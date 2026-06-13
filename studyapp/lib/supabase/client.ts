import { createBrowserClient } from "@supabase/ssr";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Hybrid storage: localStorage (primary) + cookie (fallback for mobile).
// localStorage survives app close on mobile.
// Cookie ensures the server-side middleware can also read the session.
const hybridStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const local = window.localStorage.getItem(key);
      if (local) return local;
    } catch { }
    // Fallback to cookie (e.g. if localStorage is blocked in private mode)
    const match = document.cookie.match(
      new RegExp("(?:^|; )" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch { }
    // Mirror to cookie so middleware (server-side) can read it too
    const expires = new Date(Date.now() + SEVEN_DAYS_MS).toUTCString();
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  },

  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch { }
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  },
};

// Singleton so we don't create multiple GoTrue instances
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: hybridStorage,
      },
    }
  );
  return client;
}