import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { userId, fromUserId, type, title, message, data } = await req.json();

    const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        from_user_id: fromUserId ?? null,
        type,
        title,
        message,
        data: data ?? {},
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
