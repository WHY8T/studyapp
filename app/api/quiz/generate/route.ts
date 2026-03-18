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

    const { text, title, quizId, questionCount = 10, subject_id } = await req.json();

    if (!text || text.length < 100) {
      return NextResponse.json({ error: "Not enough text content to generate quiz" }, { status: 400 });
    }

    const client = new Anthropic();

    const prompt = `You are an expert educator. Based on the following text content, generate exactly ${questionCount} multiple-choice quiz questions.

Text content:
${text.slice(0, 12000)}

Generate ${questionCount} questions in this EXACT JSON format (no other text, just the JSON array):
[
  {
    "question": "The question text here?",
    "options": [
      { "text": "Option A text", "correct": false },
      { "text": "Option B text", "correct": true },
      { "text": "Option C text", "correct": false },
      { "text": "Option D text", "correct": false }
    ],
    "explanation": "Brief explanation of why the answer is correct"
  }
]

Rules:
- Each question must have exactly 4 options
- Exactly one option per question must be correct (correct: true)
- Questions should test comprehension and key concepts from the text
- Vary difficulty: some easy, some medium, some challenging
- Make wrong options plausible but clearly incorrect
- Return ONLY the JSON array, no other text`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let questions;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      questions = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Save questions to DB if quizId provided
    if (quizId && questions.length > 0) {
      const dbQuestions = questions.map((q: any, i: number) => ({
        quiz_id: quizId,
        question: q.question,
        options: q.options,
        explanation: q.explanation || null,
        order_index: i,
      }));

      await supabase.from("quiz_questions").insert(dbQuestions);
      await supabase
        .from("quizzes")
        .update({ question_count: questions.length })
        .eq("id", quizId);
    }

    return NextResponse.json({ questions, count: questions.length });
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
