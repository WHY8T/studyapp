import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@chargily/chargily-pay";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    // Move this INSIDE the function
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const signature = request.headers.get("signature") ?? "";
    const rawBody = Buffer.from(await request.arrayBuffer());

    if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

    try {
        const isValid = verifySignature(rawBody, signature, process.env.CHARGILY_API_KEY!);
        if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    } catch {
        return NextResponse.json({ error: "Signature error" }, { status: 403 });
    }

    const event = JSON.parse(rawBody.toString());

    if (event.type === "checkout.paid") {
        const userId = event.data?.metadata?.user_id;
        if (userId) {
            await supabase
                .from("profiles")
                .update({
                    is_pro: true,
                    quiz_count: 0,
                })
                .eq("id", userId);
        }
    }

    return NextResponse.json({ received: true });
}