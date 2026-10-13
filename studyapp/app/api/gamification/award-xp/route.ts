import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLevelInfo } from "@/types";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, reason, sourceType, sourceId } = await req.json();

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const oldLevel = profile.level;
  const newXp = profile.xp + amount;
  const { level: newLevel } = getLevelInfo(newXp);

  await supabase.from("profiles").update({ xp: newXp, level: newLevel }).eq("id", user.id);
  await supabase.from("xp_transactions").insert({
    user_id: user.id,
    amount,
    reason,
    source_type: sourceType ?? null,
    source_id: sourceId ?? null,
  });

  return NextResponse.json({ xp: newXp, level: newLevel, leveledUp: newLevel > oldLevel });
}
