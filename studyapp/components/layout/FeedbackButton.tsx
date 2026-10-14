"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Bug,
  Lightbulb,
  Brain,
  Timer,
  CheckSquare,
  MoreHorizontal,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageContext";
import type { TranslationKey } from "@/components/providers/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MIN_CHARS = 5;
const MAX_CHARS = 2000;

type Sentiment = "good" | "bad";
type Category = "bug" | "feature" | "quiz" | "pomodoro" | "tasks" | "other";

const CATEGORY_KEYS: Record<Category, TranslationKey> = {
  bug: "feedback_cat_bug",
  feature: "feedback_cat_feature",
  quiz: "feedback_cat_quiz",
  pomodoro: "feedback_cat_pomodoro",
  tasks: "feedback_cat_tasks",
  other: "feedback_cat_other",
};

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  bug: Bug,
  feature: Lightbulb,
  quiz: Brain,
  pomodoro: Timer,
  tasks: CheckSquare,
  other: MoreHorizontal,
};

const CATEGORIES: Category[] = ["bug", "feature", "quiz", "pomodoro", "tasks", "other"];

export function FeedbackButton() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [sending, setSending] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, sending]);

  const close = () => {
    if (!sending) setOpen(false);
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if (trimmed.length < MIN_CHARS || sending) return;

    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from("feedback").insert({
      message: trimmed,
      sentiment,
      category,
      page: window.location.pathname,
    });
    setSending(false);

    if (error) {
      toast({ title: t("feedback_error"), variant: "destructive" });
      return;
    }

    toast({ title: t("feedback_success") });
    setMessage("");
    setSentiment(null);
    setCategory(null);
    setOpen(false);
  };

  const canSend = message.trim().length >= MIN_CHARS && !sending;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <MessageSquare />
        <span className="hidden sm:inline">{t("feedback_button")}</span>
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80"
          role="dialog"
          aria-modal="true"
          aria-label={t("feedback_title")}
          onClick={close}
        >
          <div
            className="relative w-full max-w-md rounded-lg border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute end-4 top-4 p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-semibold text-primary pe-6">{t("feedback_title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground pe-6">{t("feedback_desc")}</p>

            {/* Good / Bad toggle */}
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={sentiment === "good"}
                onClick={() => setSentiment(sentiment === "good" ? null : "good")}
                className={sentiment === "good" ? "bg-muted text-foreground" : ""}
              >
                <ThumbsUp />
                {t("feedback_good")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={sentiment === "bad"}
                onClick={() => setSentiment(sentiment === "bad" ? null : "bad")}
                className={sentiment === "bad" ? "bg-muted text-foreground" : ""}
              >
                <ThumbsDown />
                {t("feedback_bad")}
              </Button>
            </div>

            {/* Category chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((id) => {
                const Icon = CATEGORY_ICONS[id];
                const selected = category === id;
                return (
                  <Button
                    key={id}
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-pressed={selected}
                    onClick={() => setCategory(selected ? null : id)}
                    className={selected ? "bg-muted text-foreground" : ""}
                  >
                    <Icon />
                    {t(CATEGORY_KEYS[id])}
                  </Button>
                );
              })}
            </div>

            {/* Message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MAX_CHARS}
              placeholder={t("feedback_placeholder")}
              rows={4}
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border resize-none"
            />
            <p className="mt-1 text-end text-xs text-muted-foreground">
              {message.length} / {MAX_CHARS} {t("feedback_chars")}
            </p>

            <div className="mt-3 flex justify-end">
              <Button onClick={handleSend} disabled={!canSend}>
                {sending ? t("feedback_sending") : t("feedback_send")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
