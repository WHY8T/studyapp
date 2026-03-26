"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Upload, FileText, X, Check, ChevronRight,
  Loader2, Trophy, Zap, Brain, RotateCcw, ChevronLeft,
  Lightbulb, Target, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Difficulty = "easy" | "medium" | "hard" | "mixed";
type QuizStage = "upload" | "generating" | "taking" | "results";

interface Option { text: string; correct: boolean; }
interface Question {
  question: string;
  options: Option[];
  explanation: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
}

const DIFFICULTY_CONFIG = {
  easy: { label: "Easy", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30", active: "bg-green-400 text-[#0D0D18]", emoji: "" },
  medium: { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30", active: "bg-yellow-400 text-[#0D0D18]", emoji: "" },
  hard: { label: "Hard", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", active: "bg-red-400 text-[#0D0D18]", emoji: "" },
  mixed: { label: "Mixed", color: "text-[#00b7ff]", bg: "bg-[#00b7ff]/10 border-[#00b7ff]/30", active: "bg-[#00b7ff] text-[#0D0D18]", emoji: "" },
};

const QUESTION_COUNTS = [5, 10, 15, 20];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuizPage() {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stage
  const [stage, setStage] = useState<QuizStage>("upload");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [dragOver, setDragOver] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [autoSummary, setAutoSummary] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [hintText, setHintText] = useState("");
  const [loadingHint, setLoadingHint] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState("Analyzing your document...");

  // ─── File handling ──────────────────────────────────────────────────────────
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ─── Generate quiz ──────────────────────────────────────────────────────────
  const generateQuiz = async () => {
    if (!file) return;
    setStage("generating");

    const msgs = [
      "Analyzing your document...",
      "Extracting key concepts...",
      "Crafting smart questions...",
      "Adding hints and explanations...",
      "Almost ready...",
    ];
    let mi = 0;
    const interval = setInterval(() => {
      mi = (mi + 1) % msgs.length;
      setGeneratingMsg(msgs[mi]);
    }, 2000);

    try {
      // 1. Parse PDF
      const formData = new FormData();
      formData.append("file", file);
      const parseRes = await fetch("/api/pdf/parse", { method: "POST", body: formData });
      const parseData = await parseRes.json();
      if (!parseData.text) throw new Error("Could not extract text from PDF");

      // 2. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // 3. Create quiz record
      const { data: quiz } = await supabase.from("quizzes").insert({
        user_id: user.id,
        title: quizTitle || "Untitled Quiz",
        description: parseData.text.slice(0, 500),
        pdf_filename: file.name,
        question_count: questionCount,
      }).select().single();

      // 4. Generate questions
      const genRes = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: parseData.text,
          title: quizTitle,
          quizId: quiz?.id,
          questionCount,
          difficulty,
        }),
      });

      const genData = await genRes.json();
      if (!genData.questions) throw new Error(genData.error || "Generation failed");

      // 5. Use auto title if user didn't provide one
      if (!quizTitle && genData.autoTitle) setQuizTitle(genData.autoTitle);
      if (genData.autoSummary) setAutoSummary(genData.autoSummary);

      setQuestions(genData.questions);
      setAnswers(new Array(genData.questions.length).fill(null));
      setCurrentQ(0);
      setSelected(null);
      setAnswered(false);
      setStage("taking");
    } catch (err: any) {
      toast({ title: "Failed to generate quiz", description: err.message, variant: "destructive" });
      setStage("upload");
    } finally {
      clearInterval(interval);
    }
  };

  // ─── Answer handling ────────────────────────────────────────────────────────
  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setHintText("");
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
  };

  const getHint = async () => {
    if (loadingHint || !answered) return;
    const q = questions[currentQ];
    const selectedOpt = q.options[selected!];
    const correctOpt = q.options.find((o) => o.correct)!;
    if (selectedOpt.correct) return;

    setLoadingHint(true);
    try {
      const res = await fetch("/api/quiz/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          selectedOption: selectedOpt.text,
          correctOption: correctOpt.text,
          explanation: q.explanation,
          hint: q.hint,
        }),
      });
      const data = await res.json();
      setHintText(data.feedback || q.explanation);
    } catch {
      setHintText(q.explanation);
    } finally {
      setLoadingHint(false);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setStage("results");
      return;
    }
    setCurrentQ((p) => p + 1);
    setSelected(null);
    setAnswered(false);
    setHintText("");
  };

  // ─── Results ────────────────────────────────────────────────────────────────
  const score: number = answers.reduce(
    (acc: number, ans: number | null, i: number) => {
      if (ans === null) return acc;

      const option = questions[i]?.options[ans];

      if (!option) return acc;

      return acc + (option.correct ? 1 : 0);
    },
    0
  );

  const pct: number = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0;

  const xpEarned: number =
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

  // ─── RENDER: Upload ─────────────────────────────────────────────────────────
  if (stage === "upload") return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#00b7ff]" /> AI Quiz Generator
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Upload a PDF and get an instant personalized quiz</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
          ${file ? "border-[#00b7ff]/50 bg-[#00b7ff]/5" : dragOver ? "border-[#00b7ff] bg-[#00b7ff]/10 scale-[1.01]" : "border-border hover:border-[#00b7ff]/40 hover:bg-muted/30"}`}
      >
        <div className="p-8 flex flex-col items-center gap-3 text-center">
          {file ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#00b7ff]/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-[#00b7ff]" />
              </div>
              <div>
                <p className="font-semibold text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-3 h-3" /> Remove
              </button>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Upload className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">Drop your PDF here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse · max 10MB</p>
              </div>
            </>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {/* Quiz title */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Quiz Title <span className="text-muted-foreground font-normal">(optional — AI will suggest one)</span></label>
        <Input
          placeholder="e.g. Chapter 3: Cell Biology"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
        />
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Difficulty</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => {
            const cfg = DIFFICULTY_CONFIG[d];
            return (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-150
                  ${difficulty === d ? cfg.active : cfg.bg + " " + cfg.color + " hover:brightness-110"}`}>
                {cfg.emoji} {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question count */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Number of Questions</label>
        <div className="flex gap-2">
          {QUESTION_COUNTS.map((n) => (
            <button key={n} onClick={() => setQuestionCount(n)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all duration-150
                ${questionCount === n ? "bg-[#00b7ff] text-[#0D0D18] border-[#00b7ff]" : "border-border hover:border-[#00b7ff]/40 text-muted-foreground hover:text-foreground"}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={generateQuiz} disabled={!file} className="w-full h-12 text-base font-bold">
        <Sparkles className="w-5 h-5" />
        Generate Quiz
      </Button>
    </div>
  );

  // ─── RENDER: Generating ─────────────────────────────────────────────────────
  if (stage === "generating") return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-[#00b7ff]/10 border border-[#00b7ff]/20 flex items-center justify-center">
          <Brain className="w-12 h-12 text-[#00b7ff]" />
        </div>
        <div className="absolute inset-0 rounded-3xl border border-[#00b7ff]/40 animate-ping" />
      </div>
      <div className="text-center space-y-2">
        <p className="font-display font-bold text-xl">{generatingMsg}</p>
        <p className="text-sm text-muted-foreground">This usually takes 10–20 seconds</p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-[#00b7ff] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  // ─── RENDER: Taking quiz ────────────────────────────────────────────────────
  if (stage === "taking") {
    const q = questions[currentQ];
    const correctIdx = q.options.findIndex((o) => o.correct);
    const isCorrect = selected === correctIdx;
    const diffCfg = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG.medium;
    const progress = ((currentQ) / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-display font-bold text-sm text-muted-foreground">
              Question {currentQ + 1} of {questions.length}
            </p>
            {quizTitle && <p className="font-display font-black text-lg">{quizTitle}</p>}
          </div>
          <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${diffCfg.bg} ${diffCfg.color}`}>
            {diffCfg.emoji} {diffCfg.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-[#00b7ff] transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>

        {/* Question card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <p className="font-display font-bold text-lg leading-snug">{q.question}</p>

          {/* Options */}
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const letter = ["A", "B", "C", "D"][i];
              let style = "border-border hover:border-[#00b7ff]/40 hover:bg-muted/30 cursor-pointer";
              if (answered) {
                if (i === correctIdx) style = "border-green-400 bg-green-400/10 text-green-400";
                else if (i === selected && !isCorrect) style = "border-red-400 bg-red-400/10 text-red-400";
                else style = "border-border opacity-50";
              }

              return (
                <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
                  className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border transition-all duration-150 ${style}`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 
                    ${answered && i === correctIdx ? "bg-green-400 text-[#0D0D18]"
                      : answered && i === selected && !isCorrect ? "bg-red-400 text-[#0D0D18]"
                        : "bg-muted"}`}>
                    {answered && i === correctIdx ? <Check className="w-3.5 h-3.5" /> :
                      answered && i === selected && !isCorrect ? <X className="w-3.5 h-3.5" /> : letter}
                  </span>
                  <span className="text-sm font-medium">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* After answer: explanation + AI hint */}
          {answered && (
            <div className="space-y-3 pt-1">
              {/* Result badge */}
              <div className={`flex items-center gap-2 text-sm font-semibold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                {isCorrect ? <><Check className="w-4 h-4" /> Correct! +XP</> : <><X className="w-4 h-4" /> Incorrect</>}
              </div>

              {/* Explanation */}
              <div className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1">Explanation</p>
                {q.explanation}
              </div>

              {/* AI Smart Hint (only for wrong answers) */}
              {!isCorrect && (
                <div className="space-y-2">
                  {!hintText ? (
                    <Button variant="outline" size="sm" onClick={getHint} disabled={loadingHint}
                      className="flex items-center gap-2 text-[#00b7ff] border-[#00b7ff]/30 hover:bg-[#00b7ff]/10">
                      {loadingHint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                      {loadingHint ? "Getting AI feedback..." : "Get AI explanation"}
                    </Button>
                  ) : (
                    <div className="rounded-xl bg-[#00b7ff]/10 border border-[#00b7ff]/20 p-3 space-y-1">
                      <p className="text-xs font-bold text-[#00b7ff] flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> AI Tutor
                      </p>
                      <p className="text-sm text-foreground">{hintText}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Next button */}
        {answered && (
          <Button onClick={nextQuestion} className="w-full h-11 font-bold">
            {currentQ + 1 >= questions.length ? (
              <><Trophy className="w-4 h-4" /> See Results</>
            ) : (
              <>Next Question <ChevronRight className="w-4 h-4" /></>
            )}
          </Button>
        )}
      </div>
    );
  }

  // ─── RENDER: Results ────────────────────────────────────────────────────────
  if (stage === "results") return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score card */}
      <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-black
          bg-gradient-to-br from-[#00b7ff]/20 to-[#00b7ff]/5 border-2 border-[#00b7ff]/30">
          {pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : "📚"}
        </div>
        <div>
          <p className="font-display font-black text-5xl text-[#00b7ff]">{pct}%</p>
          <p className="text-muted-foreground mt-1">{score} / {questions.length} correct</p>
          {quizTitle && <p className="font-semibold text-sm mt-2">{quizTitle}</p>}
          {autoSummary && <p className="text-xs text-muted-foreground mt-1">{autoSummary}</p>}
        </div>

        {/* XP earned */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00b7ff]/10 border border-[#00b7ff]/20">
          <Zap className="w-4 h-4 text-[#00b7ff]" />
          <span className="font-bold text-[#00b7ff]">+{xpEarned} XP earned</span>
        </div>

        {/* Difficulty breakdown */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {(["easy", "medium", "hard"] as const).map((d) => {
            const cfg = DIFFICULTY_CONFIG[d];
            const dQs = questions.filter((q) => q.difficulty === d);
            const dCorrect = dQs.filter((q, qi) => {
              const globalIdx = questions.indexOf(q);
              return answers[globalIdx] === q.options.findIndex((o) => o.correct);
            }).length;
            if (dQs.length === 0) return null;
            return (
              <div key={d} className={`rounded-xl border p-3 ${cfg.bg}`}>
                <p className={`text-xs font-bold ${cfg.color}`}>{cfg.emoji} {cfg.label}</p>
                <p className="font-black text-lg mt-1">{dCorrect}/{dQs.length}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline" className="flex-1 h-11">
          <RotateCcw className="w-4 h-4" /> New Quiz
        </Button>
        <Button onClick={() => { setCurrentQ(0); setSelected(null); setAnswered(false); setAnswers(new Array(questions.length).fill(null)); setHintText(""); setStage("taking"); }}
          className="flex-1 h-11 font-bold">
          <RotateCcw className="w-4 h-4" /> Retry
        </Button>
      </div>
    </div>
  );

  return null;
}