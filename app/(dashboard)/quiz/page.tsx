
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Upload,
  FileText,
  X,
  Check,
  ChevronRight,
  Loader2,
  Trophy,
  Zap,
  Brain,
  RotateCcw,
  Lightbulb,
} from "lucide-react";

type Difficulty = "easy" | "medium" | "hard" | "mixed";
type QuizStage = "upload" | "generating" | "taking" | "results";

interface Option {
  text: string;
  correct: boolean;
}

interface Question {
  question: string;
  options: Option[];
  explanation: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
}

const DIFFICULTY_CONFIG = {
  easy: {
    label: "Easy",
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/30",
    active: "bg-green-400 text-[#0D0D18]",
    emoji: "🟢",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/30",
    active: "bg-yellow-400 text-[#0D0D18]",
    emoji: "🟡",
  },
  hard: {
    label: "Hard",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/30",
    active: "bg-red-400 text-[#0D0D18]",
    emoji: "🔴",
  },
  mixed: {
    label: "Mixed",
    color: "text-[#00b7ff]",
    bg: "bg-[#00b7ff]/10 border-[#00b7ff]/30",
    active: "bg-[#00b7ff] text-[#0D0D18]",
    emoji: "",
  },
};

const QUESTION_COUNTS = [5, 10, 15, 20];

export default function QuizPage() {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<QuizStage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [dragOver, setDragOver] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [autoSummary, setAutoSummary] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [hintText, setHintText] = useState("");
  const [loadingHint, setLoadingHint] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState("Analyzing your document...");

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      toast({ title: "Only PDF files are supported", variant: "destructive" });
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "File too large (max 10MB)", variant: "destructive" });
      return;
    }

    setFile(f);
  };

  const generateQuiz = async () => {
    if (!file) return;

    setStage("generating");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const parseRes = await fetch("/api/pdf/parse", {
        method: "POST",
        body: formData,
      });

      const parseData = await parseRes.json();

      const genRes = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: parseData.text,
          title: quizTitle,
          questionCount,
          difficulty,
        }),
      });

      const genData = await genRes.json();

      setQuestions(genData.questions);
      setAnswers(Array.from({ length: genData.questions.length }, () => null));
      setStage("taking");
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err.message,
        variant: "destructive",
      });
      setStage("upload");
    }
  };

  const handleAnswer = (idx: number) => {
    if (answered) return;

    setSelected(idx);
    setAnswered(true);

    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setStage("results");
      return;
    }

    setCurrentQ((prev) => prev + 1);
    setSelected(null);
    setAnswered(false);
    setHintText("");
  };

  const score: number = answers.reduce((acc: number, ans, i: number) => {
    if (ans === null) return acc;

    const option = questions[i]?.options[ans];

    if (!option) return acc;

    return acc + (option.correct ? 1 : 0);
  }, 0);

  const pct = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0;

  const xpEarned =
    pct >= 100 ? 150 :
      pct >= 80 ? 100 :
        pct >= 60 ? 75 :
          25;

  const reset = () => {
    setStage("upload");
    setFile(null);
    setQuizTitle("");
    setDifficulty("mixed");
    setQuestionCount(10);
    setQuestions([]);
    setAnswers([]);
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setHintText("");
    setAutoSummary("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {stage === "upload" && (
        <>
          <Input
            placeholder="Quiz title"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          <Button onClick={generateQuiz} disabled={!file}>
            Generate Quiz
          </Button>
        </>
      )}

      {stage === "taking" && questions[currentQ] && (
        <>
          <h2>{questions[currentQ].question}</h2>

          {questions[currentQ].options.map((opt, i) => (
            <Button key={i} onClick={() => handleAnswer(i)}>
              {opt.text}
            </Button>
          ))}

          {answered && (
            <Button onClick={nextQuestion}>
              Next Question
            </Button>
          )}
        </>
      )}

      {stage === "results" && (
        <>
          <h1>{pct}%</h1>
          <p>{score} / {questions.length} correct</p>
          <p>+{xpEarned} XP</p>

          <Button onClick={reset}>
            New Quiz
          </Button>
        </>
      )}
    </div>
  );
}
