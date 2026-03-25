import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) =>
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        ),
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { question, selectedOption, correctOption, explanation, hint } = await req.json();

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

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            max_tokens: 256,
            messages: [{ role: "user", content: prompt }],
        });

        const feedback = completion.choices[0]?.message?.content ?? "";

        return NextResponse.json({ feedback });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}