import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

// Use service role key so we can read all subscriptions
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    const { user_id, title, body, url } = await req.json();

    if (!user_id || !title) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", user_id)
        .single();

    if (error || !data) {
        return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    try {
        await webpush.sendNotification(
            data.subscription as webpush.PushSubscription,
            JSON.stringify({ title, body, url: url || "/friends" })
        );
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Push send error:", err);
        return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }
}