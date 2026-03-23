import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      text,
      title,
      quizId,
      questionCount = 10,
      subject_id,
      difficulty = "mixed", // 👈 NEW: "easy" | "medium" | "hard" | "mixed"
    } = await req.json();

    if (!text || text.length < 100) {
      return NextResponse.json({ error: "Not enough text content to generate quiz" }, { status: 400 });
    }

    const client = new Anthropic();

    // ─── Difficulty instructions ──────────────────────────────────────────────
    const difficultyInstructions: Record<string, string> = {
      easy: "Generate EASY questions only. Focus on basic recall, definitions, and simple facts directly stated in the text. Wrong options should be obviously incorrect.",
      medium: "Generate MEDIUM difficulty questions. Focus on understanding concepts, cause-and-effect, and applying ideas. Wrong options should be plausible.",
      hard: "Generate HARD questions only. Focus on analysis, inference, comparing concepts, and nuanced understanding. Wrong options should be very plausible and tricky.",
      mixed: "Vary difficulty: 30% easy (basic recall), 40% medium (understanding), 30% hard (analysis/inference).",
    };

    const difficultyGuide = difficultyInstructions[difficulty] || difficultyInstructions.mixed;

    // ─── 1. Generate questions ────────────────────────────────────────────────
    const questionsPrompt = `You are an expert educator. Based on the following text content, generate exactly ${questionCount} multiple-choice quiz questions.

Text content:
${text.slice(0, 12000)}

Difficulty instructions: ${difficultyGuide}

Generate ${questionCount} questions in this EXACT JSON format (no other text, just the JSON array):
[
  {
    "question": "The question text here?",
    "difficulty": "easy" | "medium" | "hard",
    "options": [
      { "text": "Option A text", "correct": false },
      { "text": "Option B text", "correct": true },
      { "text": "Option C text", "correct": false },
      { "text": "Option D text", "correct": false }
    ],
    "explanation": "Brief explanation of why the correct answer is right",
    "hint": "A helpful hint that guides the student toward the answer without giving it away"
  }
]

Rules:
- Each question must have exactly 4 options
- Exactly one option per question must be correct (correct: true)
- Every question must have a "difficulty" field: "easy", "medium", or "hard"
- Every question must have a "hint" field — a short nudge to help if stuck
- Questions should test comprehension and key concepts from the text
- Make wrong options plausible but clearly incorrect
- Return ONLY the JSON array, no other text`;

    // ─── 2. Auto-generate title & summary ────────────────────────────────────
    const metaPrompt = `Based on this text content, generate a quiz title and a short summary in this EXACT JSON format (no other text):
{
  "title": "A concise, engaging quiz title (max 8 words)",
  "summary": "A 1-2 sentence description of what this quiz covers"
}

Text content:
${text.slice(0, 3000)}`;

    // Run both in parallel
    const [questionsMessage, metaMessage] = await Promise.all([
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: questionsPrompt }],
      }),
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [{ role: "user", content: metaPrompt }],
      }),
    ]);

    const responseText =
      questionsMessage.content[0].type === "text"
        ? questionsMessage.content[0].text
        : "";

    const metaText =
      metaMessage.content[0].type === "text"
        ? metaMessage.content[0].text
        : "";

    // ─── Parse questions ──────────────────────────────────────────────────────
    let questions;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      questions = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // ─── Parse meta (title + summary) ────────────────────────────────────────
    let autoTitle = title || "Untitled Quiz";
    let autoSummary = "";
    try {
      const metaMatch = metaText.match(/\{[\s\S]*\}/);
      if (metaMatch) {
        const meta = JSON.parse(metaMatch[0]);
        autoTitle = title || meta.title || autoTitle;
        autoSummary = meta.summary || "";
      }
    } catch {
      // fail silently, title stays as-is
    }

    // ─── Save to DB ───────────────────────────────────────────────────────────
    if (quizId && questions.length > 0) {
      const dbQuestions = questions.map((q: any, i: number) => ({
        quiz_id: quizId,
        question: q.question,
        options: q.options,
        explanation: q.explanation || null,
        hint: q.hint || null,         // 👈 NEW: save hint
        difficulty: q.difficulty || difficulty, // 👈 NEW: save difficulty
        order_index: i,
      }));

      await supabase.from("quiz_questions").insert(dbQuestions);
      await supabase
        .from("quizzes")
        .update({
          question_count: questions.length,
          title: autoTitle,           // 👈 NEW: update with AI title
          summary: autoSummary,       // 👈 NEW: save summary
        })
        .eq("id", quizId);
    }

    return NextResponse.json({
      questions,
      count: questions.length,
      autoTitle,      // 👈 NEW
      autoSummary,    // 👈 NEW
    });
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate quiz" },
      { status: 500 }
    );
  }
}