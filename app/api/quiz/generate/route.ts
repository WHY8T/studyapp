import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
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
  // ✅ Fix: read both "questionCount" (from frontend) and "numQuestions" (fallback)
  const { text, questionCount, numQuestions, difficulty = "mixed", title } = body;
  const count = questionCount ?? numQuestions ?? 10;

  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `Generate ${count} multiple choice questions from the following text.
Difficulty: ${difficulty}.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "autoTitle": "Short descriptive title for this quiz",
  "autoSummary": "One sentence summary of the source material",
  "questions": [
    {
      "question": "Question text?",
      "difficulty": "easy" | "medium" | "hard",
      "options": [
        { "text": "First option", "correct": false },
        { "text": "Second option", "correct": true },
        { "text": "Third option", "correct": false },
        { "text": "Fourth option", "correct": false }
      ],
      "explanation": "Why the correct answer is correct",
      "hint": "A subtle hint without giving the answer away"
    }
  ]
}

Rules:
- Each question must have exactly 4 options
- Exactly one option must have "correct": true
- Match difficulty distribution to: ${difficulty === "mixed" ? "mix of easy, medium, hard" : difficulty}
- Never use markdown in your response

Text:
${text.slice(0, 12000)}`,
      },
    ],
  });

  const responseText = completion.choices[0].message.content ?? "";

  let parsed: { autoTitle?: string; autoSummary?: string; questions: any[] };
  try {
    parsed = JSON.parse(responseText.replace(/```json|```/g, "").trim());
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  // ✅ Safety: validate each question has the right shape
  const questions = parsed.questions?.map((q: any) => ({
    question: q.question ?? "",
    difficulty: q.difficulty ?? difficulty,
    explanation: q.explanation ?? "",
    hint: q.hint ?? "",
    options: Array.isArray(q.options)
      ? q.options.map((o: any) => ({
        text: typeof o === "string" ? o : o.text ?? "",
        correct: typeof o === "string" ? false : Boolean(o.correct),
      }))
      : [],
  }));

  await supabase
    .from("profiles")
    .update({ quiz_count: profile.quiz_count + 1 })
    .eq("id", user.id);

  return NextResponse.json({
    questions,
    autoTitle: parsed.autoTitle ?? title ?? "Untitled Quiz",
    autoSummary: parsed.autoSummary ?? "",
    quiz_count: profile.quiz_count + 1,
    is_pro: profile.is_pro,
    remaining: profile.is_pro ? null : FREE_QUIZ_LIMIT - (profile.quiz_count + 1),
  });
}