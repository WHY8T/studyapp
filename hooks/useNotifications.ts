"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type Notification = {
    id: string;
    user_id: string;
    from_user_id: string | null;
    type: "friend_request" | "friend_accepted" | "achievement" | "challenge" | "leaderboard";
    title: string;
    message: string;
    read: boolean;
    data: Record<string, any>;
    created_at: string;
    from_profile?: {
        username: string;
        full_name: string;
        avatar_url: string | null;
    };
};

// Instagram-like notification sound using Web Audio API
function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

        const playTone = (freq: number, start: number, duration: number, gain: number) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = "sine";
            gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
            gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + duration);
        };

        // Two-tone chime like Instagram
        playTone(880, 0, 0.18, 0.3);
        playTone(1100, 0.12, 0.2, 0.2);
    } catch (e) {
        // Audio not supported, fail silently
    }
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const isFirstLoad = useRef(true);

    const fetchNotifications = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("notifications")
            .select(`
        *,
        from_profile:profiles!notifications_from_user_id_fkey(
          username,
          full_name,
          avatar_url
        )
      `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(30);

        if (!error && data) {
            setNotifications(data as Notification[]);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Supabase Realtime subscription
    useEffect(() => {
        let userId: string | null = null;

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            userId = user.id;

            const channel = supabase
                .channel(`notifications:${user.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${user.id}`,
                    },
                    async (payload) => {
                        // Fetch the full notification with profile info
                        const { data } = await supabase
                            .from("notifications")
                            .select(`
                *,
                from_profile:profiles!notifications_from_user_id_fkey(
                  username,
                  full_name,
                  avatar_url
                )
              `)
                            .eq("id", payload.new.id)
                            .single();

                        if (data) {
                            setNotifications((prev) => [data as Notification, ...prev]);
                            // Play sound for new notifications (not on first load)
                            if (!isFirstLoad.current) {
                                playNotificationSound();
                            }
                        }
                    }
                )
                .subscribe();

            isFirstLoad.current = false;
            return channel;
        };

        const channelPromise = setupRealtime();

        return () => {
            channelPromise.then((channel) => {
                if (channel) supabase.removeChannel(channel);
            });
        };
    }, [supabase]);

    const markAsRead = useCallback(async (notificationId: string) => {
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notificationId);

        setNotifications((prev) =>
            prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
    }, [supabase]);

    const markAllAsRead = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", user.id)
            .eq("read", false);

        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, [supabase]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
    };
}