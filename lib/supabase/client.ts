import { createBrowserClient } from "@supabase/ssr";

// Hybrid storage: tries localStorage first, falls back to cookies.
// This keeps the session alive on mobile even after closing the browser tab.
const hybridStorageAdapter = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    // Try localStorage first
    const local = window.localStorage.getItem(key);
    if (local) return local;
    // Fallback: read from cookie
    const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    // Save in localStorage
    window.localStorage.setItem(key, value);
    // Also save as a cookie that expires in 7 days
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    // Also clear the cookie
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
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
        storage: hybridStorageAdapter, // ✅ localStorage + cookie fallback
      },
    }
  );
}