import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { question, selectedOption, correctOption, explanation, hint } = await req.json();

        const client = new Anthropic();

        const prompt = `A student answered a quiz question incorrectly. Give them smart, encouraging feedback.

Question: ${question}
Student's wrong answer: "${selectedOption}"
Correct answer: "${correctOption}"
Explanation: ${explanation}
Pre-written hint: ${hint || "none"}

Write a SHORT response (2-3 sentences max) that:
1. Gently explains WHY their answer was wrong
2. Clarifies WHY the correct answer is right
3. Uses an encouraging, friendly tone like a tutor

Do NOT say "Great question!" or be overly formal. Be direct and helpful.`;

        const message = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 256,
            messages: [{ role: "user", content: prompt }],
        });

        const feedback =
            message.content[0].type === "text" ? message.content[0].text : "";

        return NextResponse.json({ feedback });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}