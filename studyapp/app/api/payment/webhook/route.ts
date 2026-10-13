import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const rawBody = await request.text();
    let event: any;

    try {
        event = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log("Chargily webhook received:", event.type);

    if (event.type === "checkout.paid") {
        const userId = event.data?.metadata?.user_id;

        if (!userId) {
            console.error("Webhook: missing user_id in metadata");
            return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
        }

        const { error } = await supabase
            .from("profiles")
            .update({ is_pro: true, quiz_count: 0 })
            .eq("id", userId);

        if (error) {
            console.error("Supabase update error:", error);
            return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }

        console.log(`✅ User ${userId} upgraded to Pro`);
    }

    return NextResponse.json({ received: true });
}