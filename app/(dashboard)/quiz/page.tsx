"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export default function QuizPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-8">
      {/* Icon */}
      <div className="relative">
        <div className="w-28 h-28 rounded-3xl bg-lime/10 border border-lime/20 flex items-center justify-center">
          <Sparkles className="w-14 h-14 text-lime" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-lime/20 flex items-center justify-center text-sm">
          🔮
        </div>
      </div>

      {/* Text */}
      <div className="space-y-3 max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime/10 border border-lime/20 text-lime text-xs font-bold uppercase tracking-widest">
          🚧 Coming Soon
        </div>
        <h1 className="font-display font-black text-4xl">AI Quiz Generator</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Upload any PDF and get an instant personalized quiz powered by AI. Study smarter — not harder.
        </p>
      </div>

      {/* Feature preview */}
      <div className="grid grid-cols-3 gap-4 max-w-lg w-full">
        {[
          { icon: "📄", title: "Upload PDF", desc: "Any document, any subject" },
          { icon: "🤖", title: "AI Processes", desc: "Generates smart questions" },
          { icon: "🏆", title: "Earn XP", desc: "Score big on quizzes" },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-card p-4 space-y-2"
          >
            <span className="text-2xl">{f.icon}</span>
            <p className="font-display font-bold text-sm">{f.title}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          While you wait, keep studying with your other tools
        </p>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/pomodoro">
              Start Pomodoro
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/todos">
              Manage Tasks
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
