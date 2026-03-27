"use client";

import { useState, useEffect } from "react";
import { usePomodoro } from "@/hooks/usePomodoro";
import { createClient } from "@/lib/supabase/client";
import { awardXP, updateStreak } from "@/lib/gamification";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, SkipForward, Settings, Coffee, Brain, Clock, CheckCircle2, Zap, X } from "lucide-react";
import { cn, formatMinutes } from "@/lib/utils";
import type { PomodoroPhase, PomodoroSettings } from "@/types";

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  work: "#00b7ff", break: "#4ECDC4", longBreak: "#FF6B6B",
};

const LS_KEY = "studyflow:pomodoro-settings";
function loadSettings(): Partial<PomodoroSettings> {
  if (typeof window === "undefined") return {};
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function saveSettings(s: Partial<PomodoroSettings>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { }
}

export default function PomodoroPage() {
  const { toast } = useToast();
  const { t, isRTL, language } = useLanguage();
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
    toast({ title: "Settings applied ✓" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowSettings(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        supabase.from("subjects").select("*").eq("user_id", user.id).then(({ data }) => setSubjects(data ?? []));
        loadHistory(supabase, user.id);
      }
    });
  }, []);

  const loadHistory = async (supabase: ReturnType<typeof createClient>, uid: string) => {
    const { data } = await supabase.from("pomodoro_sessions").select("*, subject:subjects(*)").eq("user_id", uid).eq("completed", true).order("started_at", { ascending: false }).limit(10);
    setSessionHistory(data ?? []);
  };

  const handleSessionComplete = async (durationMinutes: number, phase: PomodoroPhase) => {
    if (phase !== "work" || !userId) return;
    const supabase = createClient();
    await supabase.from("pomodoro_sessions").insert({ user_id: userId, subject_id: subjectId, duration_minutes: durationMinutes, break_minutes: breakMinutes, completed: true, notes: sessionNotes || null, ended_at: new Date().toISOString() });
    if (subjectId) await supabase.rpc("increment_subject_minutes", { sid: subjectId, mins: durationMinutes });
    const { data: profile } = await supabase.from("profiles").select("total_study_minutes").eq("id", userId).single();
    await supabase.from("profiles").update({ total_study_minutes: (profile?.total_study_minutes ?? 0) + durationMinutes }).eq("id", userId);
    const { leveledUp, newLevel } = await awardXP(userId, 25, "Completed Pomodoro session", "pomodoro");
    await updateStreak(userId);
    await loadHistory(supabase, userId);
    toast({ title: `Session saved! +25 XP 🎉`, description: leveledUp ? `You reached Level ${newLevel}! 🚀` : `${durationMinutes} min logged. Keep going!` });
  };

  const { phase, isRunning, formattedTime, progress, sessionCount, start, pause, reset, skipPhase, setPhase } =
    usePomodoro({ onSessionComplete: handleSessionComplete, settings: { workMinutes, breakMinutes, longBreakMinutes, sessionsBeforeLongBreak, autoStartBreak, autoStartWork } });

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
          <h1 className="font-display font-black text-2xl" dir={isRTL ? "rtl" : "ltr"}>{t("pom_title")}</h1>
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
                  style={{ borderColor: phase === p ? phaseColor : "transparent" }}>
                  {p === "work" ? t("pom_focus") : p === "break" ? t("pom_short_break") : t("pom_long_break")}
                </button>
              ))}
            </div>
            <CardContent className="p-8 flex flex-col items-center gap-8">
              <div className="flex items-center gap-2">
                {phase === "work" ? <Brain className="w-5 h-5" style={{ color: phaseColor }} /> : <Coffee className="w-5 h-5" style={{ color: phaseColor }} />}
                <Badge style={{ background: `${phaseColor}20`, color: phaseColor, borderColor: `${phaseColor}40` }} className="border">{PHASE_LABELS[phase]}</Badge>
              </div>
              <div className="relative">
                <svg width="220" height="220" viewBox="0 0 220 220">
                  {isRunning && <circle cx="110" cy="110" r={R + 8} fill="none" stroke={phaseColor} strokeWidth="1" opacity="0.2" style={{ animation: "pulse-ring 2s ease-out infinite", transformOrigin: "50% 50%" }} />}
                  <circle cx="110" cy="110" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle cx="110" cy="110" r={R} fill="none" stroke={phaseColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={strokeDash} className="timer-ring transition-all duration-1000" style={{ filter: `drop-shadow(0 0 8px ${phaseColor}60)` }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono font-bold text-5xl tracking-tight">{formattedTime}</span>
                  <span className="text-xs text-muted-foreground mt-1">{t("pom_session")}{sessionCount + 1}</span>
                </div>
              </div>
              {subjects.length > 0 && (
                <div className="w-full max-w-xs">
                  <select value={subjectId ?? ""} onChange={(e) => setSubjectId(e.target.value || null)} className="w-full rounded-xl border border-border bg-muted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime/50">
                    <option value="">{t("pom_no_subject")}</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={reset}><RotateCcw className="w-5 h-5" /></Button>
                <Button size="xl" onClick={isRunning ? pause : start} className="w-20 h-20 rounded-full shadow-lg" style={{ background: phaseColor, color: "#0D0D18", boxShadow: `0 0 30px ${phaseColor}50` }}>
                  {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={skipPhase}><SkipForward className="w-5 h-5" /></Button>
              </div>
              <div className="w-full max-w-xs">
                <input type="text" placeholder={t("pom_working_on")} value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} className="w-full rounded-xl border border-border bg-transparent px-4 py-2 text-sm text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-lime/50" dir={isRTL ? "rtl" : "ltr"} />
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
                  { label: t("pom_sessions"), value: sessionHistory.filter((s) => new Date(s.started_at).toDateString() === new Date().toDateString()).length, icon: "⚡" },
                  { label: t("pom_focused"), value: formatMinutes(todayMinutes), icon: "🎯" },
                  { label: t("pom_xp_earned"), value: `+${sessionHistory.filter((s) => new Date(s.started_at).toDateString() === new Date().toDateString()).length * 25}`, icon: "💫" },
                  { label: t("pom_all_time"), value: sessionHistory.length, icon: "📊" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-muted p-3">
                    <span className="text-xl">{stat.icon}</span>
                    <p className="font-display font-bold text-lg mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2" dir={isRTL ? "rtl" : "ltr"}>
                <Clock className="w-4 h-4" />{t("pom_recent_sessions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessionHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4" dir={isRTL ? "rtl" : "ltr"}>{t("pom_no_sessions")}</p>
              ) : (
                sessionHistory.slice(0, 6).map((session) => (
                  <div key={session.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: session.subject?.color ? `${session.subject.color}20` : "hsl(var(--muted))" }}>
                      <CheckCircle2 className="w-4 h-4" style={{ color: session.subject?.color ?? "hsl(var(--muted-foreground))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{session.notes || session.subject?.name || t("pom_focus_session_label")}</p>
                      <p className="text-xs text-muted-foreground">{new Date(session.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-lime">{session.duration_minutes}{t("pom_min")}</p>
                      <p className="text-xs text-muted-foreground">+25 XP</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-lime/20 bg-lime/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-lime mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-lime">{t("pom_pro_tip")}</p>
                  <p className="text-xs text-muted-foreground mt-1" dir={isRTL ? "rtl" : "ltr"}>{t("pom_tip_text")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(8,8,15,0.85)", backdropFilter: "blur(6px)" }} onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-lime" />
                <h2 className="font-display font-bold text-base">{t("pom_settings_title")}</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {pendingSliders.map(({ label, value, min, max, step, setter, unit }) => (
                  <div key={label} className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium" dir={isRTL ? "rtl" : "ltr"}>{label}</span>
                      <span className="text-lime font-bold">{value} {unit === "sessions" ? (value === 1 ? t("pom_session_label") : t("pom_sessions_label")) : t("pom_min")}</span>
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
                  <label key={label} className="flex items-center gap-3 p-3 rounded-xl bg-muted cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => setter(!value)}>
                    <div className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0", value ? "bg-lime" : "bg-muted-foreground/30")}>
                      <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", value ? "translate-x-5" : "translate-x-0.5")} />
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