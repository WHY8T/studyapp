import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: any[]) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  // Verify sender is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId, title, body, url } = await request.json();
  if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });

  // Get target user's push subscription
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
      sub.subscription as any,
      JSON.stringify({ title, body, url: url || "/friends" })
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
