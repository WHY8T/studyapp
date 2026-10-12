import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Service role = can read any user's subscription
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const { targetUserId, title, body, url } = await request.json();

  if (!targetUserId || !title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: sub } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", targetUserId)
    .single();

  if (!sub?.subscription) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  try {
    await webpush.sendNotification(
      sub.subscription as webpush.PushSubscription,
      JSON.stringify({ title, body, url: url || "/friends" })
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}