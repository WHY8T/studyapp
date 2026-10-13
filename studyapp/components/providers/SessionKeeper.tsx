"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Keeps the Supabase session alive when the user returns to the app
 * after the phone screen was off or the app was backgrounded.
 * Without this, the middleware calls getUser() with a stale token
 * and redirects to /login even though the user is still authenticated.
 */
export function SessionKeeper() {
    useEffect(() => {
        const supabase = createClient();

        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible") {
                // Refresh session when app comes back to foreground
                await supabase.auth.getSession();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    return null;
}