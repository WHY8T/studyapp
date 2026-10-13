"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageContext";
import {
  Zap, ArrowRight, Lock, Timer, Brain, Trophy, Users, CheckSquare,
  Calendar, Flame, CheckCircle2, Circle,
} from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
        N
      </span>
      <span className="font-display text-base font-semibold tracking-tight">Nahda.Edu</span>
    </Link>
  );
}

const WEEK_BARS = [35, 55, 42, 78, 50, 88, 64];
const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const MOCK_TASKS = [
  { title: "Review Chapter 4 notes", done: true },
  { title: "Math problem set", done: false },
  { title: "Physics lab report", done: false },
];

function DashboardMock() {
  const { t } = useLanguage();

  return (
    <div aria-hidden="true" className="mx-auto mt-14 max-w-3xl sm:mt-16">
      <Card className="overflow-hidden bg-background text-start">
        {/* Fake browser bar so the preview reads as a product screenshot */}
        <div className="flex h-10 items-center border-b border-border px-4">
          <div className="flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-2 py-1">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-[11px] text-muted-foreground">nahda.edu/dashboard</span>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-5 sm:p-6">
          {/* Pomodoro */}
          <Card className="border-border/70 sm:col-span-3">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium">{t("nav_pomodoro")}</CardTitle>
              </div>
              <Badge>{t("pom_focus")}</Badge>
            </CardHeader>
            <CardContent>
              <span className="font-mono text-4xl font-semibold tracking-tight">09:30</span>
              <Progress value={62} className="mt-4 h-1.5" />
              <p className="mt-2 text-xs text-muted-foreground">{t("dash_focus_session")} · Mathematics</p>
            </CardContent>
          </Card>

          {/* Today's tasks */}
          <Card className="border-border/70 sm:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{t("dash_todays_tasks")}</CardTitle>
              <Badge variant="muted">1/3</Badge>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {MOCK_TASKS.map((task) => (
                <div key={task.title} className="flex items-center gap-2.5">
                  {task.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span className={`text-sm ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {task.title}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weekly study time */}
          <Card className="border-border/70 sm:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t("dash_weekly_study")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid h-16 grid-cols-7 items-end gap-1.5">
                {WEEK_BARS.map((bar, i) => (
                  <div key={i} className="w-full rounded-full bg-primary" style={{ height: `${bar}%` }} />
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1.5">
                {WEEK_DAYS.map((day, i) => (
                  <span key={i} className="text-center font-mono text-[10px] text-muted-foreground/60">
                    {day}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* XP progress */}
          <Card className="border-border/70 sm:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{t("dash_your_progress")}</CardTitle>
              <Badge variant="secondary">{t("dash_level")} 12</Badge>
            </CardHeader>
            <CardContent>
              <Progress value={64} className="h-1.5" />
              <p className="mt-2 font-mono text-xs text-muted-foreground">640 / 1,000 XP</p>
            </CardContent>
          </Card>
        </div>
      </Card>
    </div>
  );
}

export default function LandingPage() {
  const { t } = useLanguage();

  const features = [
    { icon: Timer, title: t("feat_pomodoro_title"), description: t("feat_pomodoro_desc") },
    { icon: Brain, title: t("feat_quiz_title"), description: t("feat_quiz_desc") },
    { icon: Trophy, title: t("feat_gamify_title"), description: t("feat_gamify_desc") },
    { icon: Users, title: t("feat_social_title"), description: t("feat_social_desc") },
    { icon: CheckSquare, title: t("feat_tasks_title"), description: t("feat_tasks_desc") },
    { icon: Calendar, title: t("feat_calendar_title"), description: t("feat_calendar_desc") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="dark" />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">{t("sign_in")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">{t("get_started")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {t("hero_badge")}
          </div>
          <h1 className="mt-6 text-5xl font-display font-semibold leading-[1.1] tracking-tight">
            {t("hero_title_1")} <span className="text-primary">{t("hero_title_2")}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("hero_desc")}
          </p>
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/register">
                {t("hero_cta")}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/login">{t("sign_in")}</Link>
            </Button>
          </div>
        </div>
        <DashboardMock />
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">{t("features_label")}</p>
            <h2 className="mt-3 text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              {t("features_title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t("features_desc")}</p>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="border-t border-border/60 pt-6">
                <div className="flex items-center gap-2.5">
                  <feature.icon className="h-4 w-4 shrink-0 text-primary" />
                  <h3 className="font-display text-base font-semibold">{feature.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-lg border border-border px-6 py-12 text-center sm:px-12 sm:py-16">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Flame className="h-4 w-4" />
            {t("cta_streak")}
          </p>
          <h2 className="mt-4 text-3xl font-display font-semibold tracking-tight sm:text-4xl">
            {t("cta_title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t("cta_desc")}
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/register">
                {t("cta_button")}
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground/70">{t("cta_xp")}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <Logo />
              <p className="text-sm text-muted-foreground">{t("footer_copy")}</p>
              <p className="text-xs text-muted-foreground/70">
                {t("footer_credit")}{" "}
                <span className="font-medium text-foreground">Ghoubali Abdelwaheb</span>
                {" "}— {t("footer_tagline")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                aria-label="Instagram"
                href="https://www.instagram.com/nahda_edu_dz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                aria-label="TikTok"
                href="https://www.tiktok.com/@nahda_edu_dz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
