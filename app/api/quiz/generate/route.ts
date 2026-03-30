import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const FREE_QUIZ_LIMIT = 2;

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
  const { text, questionCount, numQuestions, difficulty = "mixed", title } = body;
  const count = questionCount ?? numQuestions ?? 2;

  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.3-70b-instruct",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Generate ${count} quiz questions from the following text. Difficulty: ${difficulty}.

Return ONLY a valid JSON object with this exact structure, no markdown, no explanation:
{
  "autoTitle": "short title for the quiz",
  "autoSummary": "one sentence summary",
  "questions": [
    {
      "question": "the question text",
      "difficulty": "easy|medium|hard",
      "explanation": "why the correct answer is right",
      "hint": "a subtle hint without giving the answer away",
      "options": [
        { "text": "option A", "correct": false },
        { "text": "option B", "correct": true },
        { "text": "option C", "correct": false },
        { "text": "option D", "correct": false }
      ]
    }
  ]
}

Text to generate questions from:
${text}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("NVIDIA API error:", errorText);
    return NextResponse.json({ error: "AI service error", details: errorText }, { status: 502 });
  }

  const json = await res.json();
  const responseText = json.choices?.[0]?.message?.content ?? "";

  let parsed: { autoTitle?: string; autoSummary?: string; questions: any[] };
  try {
    parsed = JSON.parse(responseText.replace(/```json|```/g, "").trim());
  } catch {
    console.error("Failed to parse AI response:", responseText);
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

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