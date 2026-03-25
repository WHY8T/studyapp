import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const FREE_QUIZ_LIMIT = 10;

export async function POST(request: NextRequest) {
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_pro, quiz_count, quiz_count_reset_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!profile.is_pro && profile.quiz_count >= FREE_QUIZ_LIMIT) {
    return NextResponse.json(
      {
        error: "quota_exceeded",
        message: `You've used all ${FREE_QUIZ_LIMIT} free quizzes this month.`,
        quiz_count: profile.quiz_count,
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { text, numQuestions = 10, difficulty = "medium" } = body;

  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(`Generate ${numQuestions} multiple choice questions from the following text.
Difficulty: ${difficulty}.

Return ONLY a JSON array like this (no markdown, no explanation):
[
  {
    "question": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correct_answer": 0,
    "explanation": "Why A is correct"
  }
]

Text:
${text}`);

  const responseText = result.response.text();

  let questions;
  try {
    questions = JSON.parse(responseText.replace(/```json|```/g, "").trim());
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  await supabase
    .from("profiles")
    .update({ quiz_count: profile.quiz_count + 1 })
    .eq("id", user.id);

  return NextResponse.json({
    questions,
    quiz_count: profile.quiz_count + 1,
    is_pro: profile.is_pro,
    remaining: profile.is_pro ? null : FREE_QUIZ_LIMIT - (profile.quiz_count + 1),
  });
}