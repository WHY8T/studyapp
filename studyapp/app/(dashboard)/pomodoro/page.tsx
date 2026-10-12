"use client";

import { useState, useEffect, useCallback } from "react";
import { usePomodoro } from "@/hooks/usePomodoro";
import { createClient } from "@/lib/supabase/client";
import { awardXP, updateStreak } from "@/lib/gamification";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, RotateCcw, SkipForward, Settings,
  Coffee, Brain, Clock, CheckCircle2, Zap, X, Target, Star, BarChart2,
} from "lucide-react";
import { cn, formatMinutes } from "@/lib/utils";
import type { PomodoroPhase, PomodoroSettings } from "@/types";

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  work: "primary", break: "success", longBreak: "destructive",
};

const LS_KEY = "studyflow:pomodoro-settings";
function loadSettings(): Partial<PomodoroSettings> {
  if (typeof window === "undefined") return {};
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function saveSettings(s: Partial<PomodoroSettings>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { }
}

// ── Click sound played on start ────────────────────────────────────────────
function playClickSound() {
  try {
    const AudioCtx = (window as any).webkitAudioContext ?? window.AudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 600;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch { }
}

export default function PomodoroPage() {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4);
  const [autoStartBreak, setAutoStartBreak] = useState(false);
  const [autoStartWork, setAutoStartWork] = useState(false);
  const [pendingWork, setPendingWork] = useState(25);
  const [pendingBreak, setPendingBreak] = useState(5);
  const [pendingLongBreak, setPendingLongBreak] = useState(15);
  const [pendingSessions, setPendingSessions] = useState(4);
  const [pendingAutoBreak, setPendingAutoBreak] = useState(false);
  const [pendingAutoWork, setPendingAutoWork] = useState(false);

  useEffect(() => {
    const saved = loadSettings();
    if (saved.workMinutes) { setWorkMinutes(saved.workMinutes); setPendingWork(saved.workMinutes); }
    if (saved.breakMinutes) { setBreakMinutes(saved.breakMinutes); setPendingBreak(saved.breakMinutes); }
    if (saved.longBreakMinutes) { setLongBreakMinutes(saved.longBreakMinutes); setPendingLongBreak(saved.longBreakMinutes); }
    if (saved.sessionsBeforeLongBreak) { setSessionsBeforeLongBreak(saved.sessionsBeforeLongBreak); setPendingSessions(saved.sessionsBeforeLongBreak); }
    if (typeof saved.autoStartBreak === "boolean") { setAutoStartBreak(saved.autoStartBreak); setPendingAutoBreak(saved.autoStartBreak); }
    if (typeof saved.autoStartWork === "boolean") { setAutoStartWork(saved.autoStartWork); setPendingAutoWork(saved.autoStartWork); }
  }, []);

  const openSettings = () => {
    setPendingWork(workMinutes); setPendingBreak(breakMinutes); setPendingLongBreak(longBreakMinutes);
    setPendingSessions(sessionsBeforeLongBreak); setPendingAutoBreak(autoStartBreak); setPendingAutoWork(autoStartWork);
    setShowSettings(true);
  };

  const applySettings = () => {
    setWorkMinutes(pendingWork); setBreakMinutes(pendingBreak); setLongBreakMinutes(pendingLongBreak);
    setSessionsBeforeLongBreak(pendingSessions); setAutoStartBreak(pendingAutoBreak); setAutoStartWork(pendingAutoWork);
    saveSettings({ workMinutes: pendingWork, breakMinutes: pendingBreak, longBreakMinutes: pendingLongBreak, sessionsBeforeLongBreak: pendingSessions, autoStartBreak: pendingAutoBreak, autoStartWork: pendingAutoWork });
    setShowSettings(false);
    toast({ title: "Settings applied" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowSettings(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Auth — timer works even when logged out ─────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        supabase.from("subjects").select("*").eq("user_id", user.id).then(({ data }) => setSubjects(data ?? []));
        loadHistory(supabase, user.id);
      }
      // If no user, timer still works — just no XP/history saved
    });
  }, []);

  const loadHistory = async (supabase: ReturnType<typeof createClient>, uid: string) => {
    const { data } = await supabase.from("pomodoro_sessions").select("*, subject:subjects(*)").eq("user_id", uid).eq("completed", true).order("started_at", { ascending: false }).limit(10);
    setSessionHistory(data ?? []);
  };

  const handleSessionComplete = async (durationMinutes: number, phase: PomodoroPhase) => {
    if (phase !== "work") return;

    // ── Browser notification (works even when signed out) ──────────────────
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Focus session complete!", {
          body: `${durationMinutes} min logged. Time for a break!`,
          icon: "/favicon.ico",
        });
      } catch { }
    }

    // ── Save to DB only if logged in ───────────────────────────────────────
    if (!userId) return;

    const supabase = createClient();
    await supabase.from("pomodoro_sessions").insert({
      user_id: userId, subject_id: subjectId, duration_minutes: durationMinutes,
      break_minutes: breakMinutes, completed: true, notes: sessionNotes || null,
      ended_at: new Date().toISOString(),
    });
    if (subjectId) await supabase.rpc("increment_subject_minutes", { sid: subjectId, mins: durationMinutes });
    const { data: profile } = await supabase.from("profiles").select("total_study_minutes").eq("id", userId).single();
    await supabase.from("profiles").update({ total_study_minutes: (profile?.total_study_minutes ?? 0) + durationMinutes }).eq("id", userId);
    const { leveledUp, newLevel } = await awardXP(userId, 25, "Completed Pomodoro session", "pomodoro");
    await updateStreak(userId);
    await loadHistory(supabase, userId);
    toast({ title: `Session saved! +25 XP`, description: leveledUp ? `You reached Level ${newLevel}!` : `${durationMinutes} min logged. Keep going!` });
  };

  const { phase, isRunning, formattedTime, progress, sessionCount, start, pause, reset, skipPhase, setPhase } =
    usePomodoro({ onSessionComplete: handleSessionComplete, settings: { workMinutes, breakMinutes, longBreakMinutes, sessionsBeforeLongBreak, autoStartBreak, autoStartWork } });
  useEffect(() => {
    const onSync = (e: Event) => {
      const { mode, remaining, running } = (e as CustomEvent).detail;
      const phaseMap: Record<string, PomodoroPhase> = {
        work: "work", short: "break", long: "longBreak",
      };
      if (phaseMap[mode]) setPhase(phaseMap[mode]);
      if (running && !isRunning) start();
      if (!running && isRunning) pause();
    };
    window.addEventListener("pomodoro-sync", onSync);
    return () => window.removeEventListener("pomodoro-sync", onSync);
  }, [isRunning, start, pause, setPhase]);


  const handleStartPause = useCallback(() => {
    if (!isRunning) {
      playClickSound();
      start();
    } else {
      pause();
    }
  }, [isRunning, start, pause]);

  const phaseColor = PHASE_COLORS[phase];
  const R = 90; const CIRC = 2 * Math.PI * R; const strokeDash = CIRC - (progress / 100) * CIRC;
  const todayMinutes = sessionHistory.filter((s) => new Date(s.started_at).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.duration_minutes, 0);
  const PHASE_LABELS: Record<PomodoroPhase, string> = { work: t("pom_focus_time"), break: t("pom_break_time"), longBreak: t("pom_long_break_time") };

  const pendingSliders = [
    { label: t("pom_focus_duration"), value: pendingWork, min: 5, max: 120, step: 5, setter: setPendingWork, unit: "min" },
    { label: t("pom_short_break_dur"), value: pendingBreak, min: 1, max: 30, step: 1, setter: setPendingBreak, unit: "min" },
    { label: t("pom_long_break_dur"), value: pendingLongBreak, min: 5, max: 60, step: 5, setter: setPendingLongBreak, unit: "min" },
    { label: t("pom_sessions_long"), value: pendingSessions, min: 1, max: 8, step: 1, setter: setPendingSessions, unit: "sessions" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight" dir={isRTL ? "rtl" : "ltr"}>{t("pom_title")}</h1>
          <p className="text-muted-foreground text-sm mt-1" dir={isRTL ? "rtl" : "ltr"}>{t("pom_subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={openSettings}>
          <Settings className="w-4 h-4" />{t("pom_settings")}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex border-b border-border">
              {(["work", "break", "longBreak"] as PomodoroPhase[]).map((p) => (
                <button key={p} onClick={() => setPhase(p)}
                  className={cn("flex-1 py-3 text-sm font-display font-semibold transition-all", phase === p ? "border-b-2 text-foreground" : "text-muted-foreground hover:text-foreground")}
                  style={{ borderColor: phase === p ? `hsl(var(--${phaseColor}))` : "transparent" }}>
                  {p === "work" ? t("pom_focus") : p === "break" ? t("pom_short_break") : t("pom_long_break")}
                </button>
              ))}
            </div>

            <CardContent className="p-8 flex flex-col items-center gap-8">
              <div className="flex items-center gap-2">
                {phase === "work"
                  ? <Brain className="w-5 h-5" style={{ color: `hsl(var(--${phaseColor}))` }} />
                  : <Coffee className="w-5 h-5" style={{ color: `hsl(var(--${phaseColor}))` }} />}
                <Badge style={{ background: `hsl(var(--${phaseColor}) / 0.1)`, color: `hsl(var(--${phaseColor}))`, borderColor: `hsl(var(--${phaseColor}) / 0.3)` }} className="border">
                  {PHASE_LABELS[phase]}
                </Badge>
              </div>

              {/* Timer ring */}
              <div className="relative">
                <svg width="220" height="220" viewBox="0 0 220 220">
                  <circle cx="110" cy="110" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle cx="110" cy="110" r={R} fill="none" stroke="hsl(var(--${phaseColor}))" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={CIRC} strokeDashoffset={strokeDash}
                    className="timer-ring transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-5xl font-semibold tracking-tight">{formattedTime}</span>
                  <span className="text-xs text-muted-foreground mt-1">{t("pom_session")}{sessionCount + 1}</span>
                </div>
              </div>

              {subjects.length > 0 && (
                <div className="w-full max-w-xs">
                  <select value={subjectId ?? ""} onChange={(e) => setSubjectId(e.target.value || null)}
                    className="w-full rounded-md border border-input bg-transparent px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                    <option value="">{t("pom_no_subject")}</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {/* ── Controls — fixed play button ─────────────────────────── */}
              <div className="flex items-center gap-6">
                <button
                  onClick={reset}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* Play/Pause button — explicit size, no Button component */}
                <button
                  onClick={handleStartPause}
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-95"
                  style={{ background: `hsl(var(--${phaseColor}))` }}
                >
                  {isRunning
                    ? <Pause className="w-8 h-8 text-primary-foreground" />
                    : <Play className="w-8 h-8 text-primary-foreground translate-x-0.5" />
                  }
                </button>

                <button
                  onClick={skipPhase}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full max-w-xs">
                <input type="text" placeholder={t("pom_working_on")} value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-4 py-2 text-sm text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  dir={isRTL ? "rtl" : "ltr"} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <p className="font-display font-semibold text-sm" dir={isRTL ? "rtl" : "ltr"}>{t("pom_todays_progress")}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t("pom_sessions"), value: sessionHistory.filter((s) => new Date(s.started_at).toDateString() === new Date().toDateString()).length, icon: <Zap className="w-4 h-4 text-primary" /> },
                  { label: t("pom_focused"), value: formatMinutes(todayMinutes), icon: <Target className="w-4 h-4 text-primary" /> },
                  { label: t("pom_xp_earned"), value: `+${sessionHistory.filter((s) => new Date(s.started_at).toDateString() === new Date().toDateString()).length * 25}`, icon: <Star className="w-4 h-4 text-primary" /> },
                  { label: t("pom_all_time"), value: sessionHistory.length, icon: <BarChart2 className="w-4 h-4 text-primary" /> },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-md bg-muted p-3">
                    <div className="mb-1 grid h-7 w-7 place-items-center rounded-md bg-card">{stat.icon}</div>
                    <p className="mt-1 font-display text-lg font-semibold tracking-tight">{stat.value}</p>
                    <p className="text-xs text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2" dir={isRTL ? "rtl" : "ltr"}>
                <Clock className="w-4 h-4 text-primary" />{t("pom_recent_sessions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessionHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4" dir={isRTL ? "rtl" : "ltr"}>{t("pom_no_sessions")}</p>
              ) : (
                sessionHistory.slice(0, 6).map((session) => (
                  <div key={session.id} className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center"
                      style={{ background: session.subject?.color ? `${session.subject.color}20` : "hsl(var(--muted))" }}>
                      <CheckCircle2 className="w-4 h-4" style={{ color: session.subject?.color ?? "hsl(var(--muted-foreground))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{session.notes || session.subject?.name || t("pom_focus_session_label")}</p>
                      <p className="text-xs text-muted-foreground">{new Date(session.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-muted-foreground">{session.duration_minutes}{t("pom_min")}</p>
                      <p className="font-mono text-xs text-muted-foreground">+25 XP</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-muted/40">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{t("pom_pro_tip")}</p>
                  <p className="text-xs text-muted-foreground mt-1" dir={isRTL ? "rtl" : "ltr"}>{t("pom_tip_text")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-lg rounded-lg border border-border bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <h2 className="font-display text-base font-semibold tracking-tight">{t("pom_settings_title")}</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {pendingSliders.map(({ label, value, min, max, step, setter, unit }) => (
                  <div key={label} className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium" dir={isRTL ? "rtl" : "ltr"}>{label}</span>
                      <span className="font-mono text-muted-foreground">{value} {unit === "sessions" ? (value === 1 ? t("pom_session_label") : t("pom_sessions_label")) : t("pom_min")}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => setter(Number(e.target.value))} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>{min}</span><span>{max}</span></div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t("pom_auto_breaks"), value: pendingAutoBreak, setter: setPendingAutoBreak },
                  { label: t("pom_auto_focus"), value: pendingAutoWork, setter: setPendingAutoWork },
                ].map(({ label, value, setter }) => (
                  <label key={label} className="flex cursor-pointer items-center gap-3 rounded-md bg-muted p-3 transition-colors hover:bg-muted/80" onClick={() => setter(!value)}>
                    <div className={cn("relative h-5 w-10 shrink-0 rounded-full transition-colors", value ? "bg-primary" : "bg-foreground/20")}>
                      <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-primary-foreground transition-transform", value ? "translate-x-5" : "translate-x-0.5")} />
                    </div>
                    <span className="text-sm font-medium" dir={isRTL ? "rtl" : "ltr"}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>{t("pom_changes_note")}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowSettings(false)}>{t("pom_cancel")}</Button>
                <Button size="sm" onClick={applySettings}>{t("pom_apply")}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}