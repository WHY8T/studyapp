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

interface UsePomodoroOptions {
  onSessionComplete?: (durationMinutes: number, phase: PomodoroPhase) => void;
  settings?: Partial<PomodoroSettings>;
}

export function usePomodoro({
  onSessionComplete,
  settings: settingsOverride = {},
}: UsePomodoroOptions = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...settingsOverride };

  const [phase, setPhase] = useState<PomodoroPhase>("work");
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(settings.workMinutes * 60);
  const [sessionCount, setSessionCount] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs to avoid stale closures inside interval / advance
  const phaseRef = useRef<PomodoroPhase>("work");
  const sessionCountRef = useRef(0);
  const settingsRef = useRef(settings);
  // Tracks actual seconds elapsed in the current work phase
  const workSecondsElapsedRef = useRef(0);

  // Keep refs in sync with latest state/props
  phaseRef.current = phase;
  sessionCountRef.current = sessionCount;
  settingsRef.current = settings;

  // ── Utilities ──────────────────────────────────────────────

  const getPhaseSeconds = useCallback((p: PomodoroPhase): number => {
    const s = settingsRef.current;
    if (p === "work") return s.workMinutes * 60;
    if (p === "break") return s.breakMinutes * 60;
    return s.longBreakMinutes * 60;
  }, []);

  const playSound = useCallback((type: "work" | "break") => {
    if (!settingsRef.current.soundEnabled) return;
    try {
      const AudioCtx =
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
        window.AudioContext;
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
    } catch {
      // AudioContext unavailable
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification(title, { body, icon: "/favicon.ico" });
      } catch {
        // Notification API unavailable
      }
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      await Notification.requestPermission();
    }
  }, []);

  // ── Advance to next phase ───────────────────────────────────
  // isSkip = true → user pressed Skip: use actual elapsed time
  // isSkip = false → natural timer end: use full preset duration

  const advance = useCallback(
    (isSkip: boolean) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);

      const currentPhase = phaseRef.current;
      const s = settingsRef.current;

      if (currentPhase === "work") {
        const newCount = sessionCountRef.current + 1;
        setSessionCount(newCount);

        // Calculate actual minutes studied
        const elapsedSeconds = workSecondsElapsedRef.current;
        const actualMinutes = isSkip
          ? Math.max(1, Math.floor(elapsedSeconds / 60))
          : s.workMinutes;

        // Reset elapsed counter
        workSecondsElapsedRef.current = 0;

        // Notify parent (save to DB, award XP, etc.)
        if (actualMinutes >= 1) {
          onSessionComplete?.(actualMinutes, "work");
        }

        // Determine next phase
        const nextPhase =
          newCount % s.sessionsBeforeLongBreak === 0 ? "longBreak" : "break";

        setPhase(nextPhase);
        setSecondsLeft(nextPhase === "longBreak" ? s.longBreakMinutes * 60 : s.breakMinutes * 60);

        playSound("break");
        sendNotification(
          "Focus session complete! 🎉",
          isSkip
            ? `You studied for ${actualMinutes} min. Take a well-deserved break!`
            : `${s.workMinutes}-min session done. Time for a break!`
        );

        if (s.autoStartBreak) {
          setTimeout(() => setIsRunning(true), 100);
        }
      } else {
        // Break ended → back to work
        workSecondsElapsedRef.current = 0;
        setPhase("work");
        setSecondsLeft(s.workMinutes * 60);

        playSound("work");
        sendNotification("Break over! 💪", "Ready for your next focus session?");

        if (s.autoStartWork) {
          setTimeout(() => setIsRunning(true), 100);
        }
      }
    },
    [onSessionComplete, playSound, sendNotification]
  );

  // ── Countdown interval ──────────────────────────────────────

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        // Increment elapsed work seconds FIRST (before checking completion)
        if (phaseRef.current === "work") {
          workSecondsElapsedRef.current += 1;
        }

        if (prev <= 1) {
          // Natural completion — schedule advance outside setState
          setTimeout(() => advance(false), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
    setSecondsLeft(
      phaseRef.current === "work"
        ? settingsRef.current.workMinutes * 60
        : phaseRef.current === "break"
        ? settingsRef.current.breakMinutes * 60
        : settingsRef.current.longBreakMinutes * 60
    );
  }, []);

  const skipPhase = useCallback(() => advance(true), [advance]);

  const setPhaseManually = useCallback((p: PomodoroPhase) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    workSecondsElapsedRef.current = 0;
    setPhase(p);
    const s = settingsRef.current;
    setSecondsLeft(
      p === "work"
        ? s.workMinutes * 60
        : p === "break"
        ? s.breakMinutes * 60
        : s.longBreakMinutes * 60
    );
  }, []);

  const totalSeconds =
    phase === "work"
      ? settings.workMinutes * 60
      : phase === "break"
      ? settings.breakMinutes * 60
      : settings.longBreakMinutes * 60;

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return {
    phase,
    isRunning,
    secondsLeft,
    formattedTime: formatTimer(secondsLeft),
    progress,
    sessionCount,
    start,
    pause,
    reset,
    skipPhase,
    setPhase: setPhaseManually,
    settings,
  };
}
