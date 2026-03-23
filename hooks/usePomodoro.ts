"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatTimer } from "@/lib/utils";
import type { PomodoroPhase, PomodoroSettings } from "@/types";

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreak: false,
  autoStartWork: false,
  soundEnabled: true,
};

const PERSIST_KEY = "studyflow:pomodoro-state";

interface PersistedState {
  phase: PomodoroPhase;
  secondsLeft: number;
  sessionCount: number;
  isRunning: boolean;
  savedAt: number; // timestamp when we saved
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const state: PersistedState = JSON.parse(raw);
    // If it was running, calculate how many seconds passed while away
    if (state.isRunning && state.savedAt) {
      const elapsed = Math.floor((Date.now() - state.savedAt) / 1000);
      state.secondsLeft = Math.max(0, state.secondsLeft - elapsed);
    }
    return state;
  } catch {
    return null;
  }
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function clearState() {
  try {
    localStorage.removeItem(PERSIST_KEY);
  } catch { /* ignore */ }
}

interface UsePomodoroOptions {
  onSessionComplete?: (durationMinutes: number, phase: PomodoroPhase) => void;
  settings?: Partial<PomodoroSettings>;
}

export function usePomodoro({
  onSessionComplete,
  settings: settingsOverride = {},
}: UsePomodoroOptions = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...settingsOverride };

  // Load persisted state on first render
  const persisted = typeof window !== "undefined" ? loadPersistedState() : null;

  const [phase, setPhase] = useState<PomodoroPhase>(persisted?.phase ?? "work");
  const [isRunning, setIsRunning] = useState(persisted?.isRunning ?? false);
  const [sessionCount, setSessionCount] = useState(persisted?.sessionCount ?? 0);
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (persisted) return persisted.secondsLeft;
    return settings.workMinutes * 60;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<PomodoroPhase>(phase);
  const sessionCountRef = useRef(sessionCount);
  const settingsRef = useRef(settings);
  const workSecondsElapsedRef = useRef(0);
  const secondsLeftRef = useRef(secondsLeft);

  phaseRef.current = phase;
  sessionCountRef.current = sessionCount;
  settingsRef.current = settings;
  secondsLeftRef.current = secondsLeft;

  // ── Persist state whenever it changes ──────────────────────
  useEffect(() => {
    saveState({
      phase,
      secondsLeft,
      sessionCount,
      isRunning,
      savedAt: Date.now(),
    });
  }, [phase, secondsLeft, sessionCount, isRunning]);

  // ── Save on page unload/navigation ─────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      saveState({
        phase: phaseRef.current,
        secondsLeft: secondsLeftRef.current,
        sessionCount: sessionCountRef.current,
        isRunning,
        savedAt: Date.now(),
      });
    };
    window.addEventListener("beforeunload", handleUnload);
    // Also save on visibility change (mobile navigation)
    document.addEventListener("visibilitychange", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleUnload);
      handleUnload(); // save on component unmount (route change)
    };
  }, [isRunning]);

  // ── Utilities ───────────────────────────────────────────────
  const playSound = useCallback((type: "work" | "break") => {
    if (!settingsRef.current.soundEnabled) return;
    try {
      const AudioCtx =
        (window as any).webkitAudioContext ?? window.AudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = type === "work" ? 440 : 523;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch { /* ignore */ }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(title, { body, icon: "/favicon.ico" }); } catch { /* ignore */ }
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  // ── Advance to next phase ───────────────────────────────────
  const advance = useCallback((isSkip: boolean) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);

    const currentPhase = phaseRef.current;
    const s = settingsRef.current;

    if (currentPhase === "work") {
      const newCount = sessionCountRef.current + 1;
      setSessionCount(newCount);

      const elapsedSeconds = workSecondsElapsedRef.current;
      const actualMinutes = isSkip
        ? Math.max(1, Math.floor(elapsedSeconds / 60))
        : s.workMinutes;

      workSecondsElapsedRef.current = 0;

      if (actualMinutes >= 1) {
        onSessionComplete?.(actualMinutes, "work");
      }

      const nextPhase = newCount % s.sessionsBeforeLongBreak === 0 ? "longBreak" : "break";
      setPhase(nextPhase);
      setSecondsLeft(nextPhase === "longBreak" ? s.longBreakMinutes * 60 : s.breakMinutes * 60);

      playSound("break");
      sendNotification("Focus session complete! 🎉",
        isSkip ? `You studied for ${actualMinutes} min. Take a break!` : `${s.workMinutes}-min session done. Break time!`
      );

      if (s.autoStartBreak) setTimeout(() => setIsRunning(true), 100);
    } else {
      workSecondsElapsedRef.current = 0;
      setPhase("work");
      setSecondsLeft(s.workMinutes * 60);
      playSound("work");
      sendNotification("Break over! 💪", "Ready for your next focus session?");
      if (s.autoStartWork) setTimeout(() => setIsRunning(true), 100);
    }
  }, [onSessionComplete, playSound, sendNotification]);

  // ── Countdown interval ──────────────────────────────────────
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (phaseRef.current === "work") workSecondsElapsedRef.current += 1;
        if (prev <= 1) {
          setTimeout(() => advance(false), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, advance]);

  // ── Public API ──────────────────────────────────────────────
  const start = useCallback(() => {
    requestNotificationPermission();
    setIsRunning(true);
  }, [requestNotificationPermission]);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    workSecondsElapsedRef.current = 0;
    const s = settingsRef.current;
    const secs = phaseRef.current === "work" ? s.workMinutes * 60
      : phaseRef.current === "break" ? s.breakMinutes * 60
        : s.longBreakMinutes * 60;
    setSecondsLeft(secs);
    clearState();
  }, []);

  const skipPhase = useCallback(() => advance(true), [advance]);

  const setPhaseManually = useCallback((p: PomodoroPhase) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    workSecondsElapsedRef.current = 0;
    setPhase(p);
    const s = settingsRef.current;
    setSecondsLeft(
      p === "work" ? s.workMinutes * 60
        : p === "break" ? s.breakMinutes * 60
          : s.longBreakMinutes * 60
    );
  }, []);

  const totalSeconds =
    phase === "work" ? settings.workMinutes * 60
      : phase === "break" ? settings.breakMinutes * 60
        : settings.longBreakMinutes * 60;

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return {
    phase, isRunning, secondsLeft,
    formattedTime: formatTimer(secondsLeft),
    progress, sessionCount,
    start, pause, reset, skipPhase,
    setPhase: setPhaseManually,
    settings,
  };
}