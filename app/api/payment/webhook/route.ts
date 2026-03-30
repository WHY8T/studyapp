import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@chargily/chargily-pay";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const signature = request.headers.get("signature") ?? "";
    const rawBody = Buffer.from(await request.arrayBuffer());

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    try {
        // ✅ Use CHARGILY_SECRET (webhook secret), NOT the API key
        const isValid = verifySignature(rawBody, signature, process.env.CHARGILY_SECRET!);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }
    } catch (err) {
        console.error("Signature verification error:", err);
        return NextResponse.json({ error: "Signature error" }, { status: 403 });
    }

    const event = JSON.parse(rawBody.toString());
    console.log("Chargily webhook event:", event.type);

    if (event.type === "checkout.paid") {
        const userId = event.data?.metadata?.user_id;
        if (!userId) {
            console.error("Webhook: missing user_id in metadata");
            return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
        }

        const { error } = await supabase
            .from("profiles")
            .update({
                is_pro: true,
                quiz_count: 0,
            })
            .eq("id", userId);

        if (error) {
            console.error("Supabase update error:", error);
            return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }

        console.log(`✅ User ${userId} upgraded to Pro`);
    }

    return NextResponse.json({ received: true });
}