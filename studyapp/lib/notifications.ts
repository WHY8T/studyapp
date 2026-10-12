import { createClient } from "@/lib/supabase/server";

type NotificationType =
    | "friend_request"
    | "friend_accepted"
    | "achievement"
    | "challenge"
    | "leaderboard";

interface SendNotificationParams {
    userId: string;           // who receives it
    fromUserId?: string;      // who triggered it (optional)
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
}

export async function sendNotification({
    userId,
    fromUserId,
    type,
    title,
    message,
    data = {},
}: SendNotificationParams) {
    const supabase = await createClient();

    const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        from_user_id: fromUserId ?? null,
        type,
        title,
        message,
        data,
    });

    if (error) {
        console.error("[sendNotification] error:", error.message);
    }
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

export async function notifyFriendRequest(toUserId: string, fromUser: { id: string; name: string }) {
    return sendNotification({
        userId: toUserId,
        fromUserId: fromUser.id,
        type: "friend_request",
        title: "New friend request",
        message: `${fromUser.name} wants to be your study buddy!`,
    });
}

export async function notifyFriendAccepted(toUserId: string, acceptedBy: { id: string; name: string }) {
    return sendNotification({
        userId: toUserId,
        fromUserId: acceptedBy.id,
        type: "friend_accepted",
        title: "Friend request accepted!",
        message: `${acceptedBy.name} accepted your friend request. Start studying together!`,
    });
}

export async function notifyAchievement(userId: string, achievement: { name: string; xp: number }) {
    return sendNotification({
        userId,
        type: "achievement",
        title: "Achievement unlocked! 🏆",
        message: `You earned "${achievement.name}" and got +${achievement.xp} XP!`,
        data: { achievement_name: achievement.name, xp: achievement.xp },
    });
}