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

const PERSIST_KEY = "nahda-edu:pomodoro-state";

interface PersistedState {
  phase: PomodoroPhase;
  secondsLeft: number;
  sessionCount: number;
  isRunning: boolean;
  endTime: number | null; // absolute wall-clock end timestamp (ms)
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const state: PersistedState = JSON.parse(raw);

    // BUG FIX 1: Use the stored endTime directly instead of re-computing
    // elapsed from a savedAt snapshot. The old code used savedAt + secondsLeft
    // which drifted every time the page re-rendered while running.
    if (state.isRunning && state.endTime) {
      const remaining = Math.round((state.endTime - Date.now()) / 1000);
      state.secondsLeft = Math.max(0, remaining);
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

  // HYDRATION FIX: initialize with defaults only — localStorage is never
  // read during render. The old code restored the persisted phase here,
  // which only ran on the client (server has no window), so the first
  // client render diverged from the server HTML: e.g. a saved "break"
  // phase rendered the Coffee icon on the client while the server had
  // rendered "work" with the Brain icon. The saved state is restored in
  // an effect after mount instead (see "Restore persisted state" below).
  const [phase, setPhase] = useState<PomodoroPhase>("work");
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(settings.workMinutes * 60);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<PomodoroPhase>(phase);
  const sessionCountRef = useRef(sessionCount);
  const settingsRef = useRef(settings);
  const workSecondsElapsedRef = useRef(0);
  const secondsLeftRef = useRef(secondsLeft);

  // The single source of truth for "when does this phase end".
  // Set when timer starts/resumes, cleared when paused/reset/phase-ends.
  // (Restored from persisted state after mount — see the restore effect.)
  const endTimeRef = useRef<number | null>(null);

  phaseRef.current = phase;
  sessionCountRef.current = sessionCount;
  settingsRef.current = settings;
  secondsLeftRef.current = secondsLeft;

  // True once the persisted state has been restored after mount. Gates the
  // persist effect so the mount render's defaults can't overwrite the saved
  // state before it has been read back.
  const hydratedRef = useRef(false);

  // ── Persist state — store endTime, NOT savedAt ────────────────────────────
  // BUG FIX 3: The old code saved `savedAt: Date.now()` on EVERY render tick
  // (because secondsLeft was in the dep array). This meant the savedAt was
  // always "now" and elapsed = 0, so the timer appeared to resume from the
  // same point. We now save endTime instead, which is stable across ticks.
  useEffect(() => {
    // Skip the mount run: the restore effect below hasn't read the saved
    // state yet, so saving here would clobber it with defaults.
    if (!hydratedRef.current) return;
    saveState({
      phase,
      secondsLeft,
      sessionCount,
      isRunning,
      endTime: endTimeRef.current,
    });
  }, [phase, secondsLeft, sessionCount, isRunning]);

  // ── Restore persisted state after mount (hydration-safe) ──────────────────
  // Deliberately declared AFTER the persist effect: effects run in
  // declaration order, so on mount the persist effect sees hydratedRef
  // === false and skips, keeping the saved state intact until it is read
  // here. Must stay an empty-deps mount effect.
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      // BUG FIX 2 (preserved): restore endTime on mount if we were running
      // when the page was left. Without the anchor, re-mounting (e.g.
      // navigating back) would re-anchor the interval from the already-
      // stale secondsLeft value. Set it BEFORE setIsRunning so the timer
      // effect sees it when it re-runs.
      if (persisted.isRunning && persisted.endTime) {
        endTimeRef.current = persisted.endTime;
      }
      setPhase(persisted.phase);
      setIsRunning(persisted.isRunning);
      setSessionCount(persisted.sessionCount);
      setSecondsLeft(persisted.secondsLeft);
      secondsLeftRef.current = persisted.secondsLeft;
    }
    hydratedRef.current = true;
  }, []);

  // BUG FIX 4: The old visibilitychange "handleUnload" listener captured
  // `isRunning` by closure, so when it fired it always saved the value of
  // isRunning from the time the effect ran — not the current value. We use
  // a ref to get the live value.
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  useEffect(() => {
    const handleHide = () => {
      saveState({
        phase: phaseRef.current,
        secondsLeft: secondsLeftRef.current,
        sessionCount: sessionCountRef.current,
        isRunning: isRunningRef.current,
        endTime: endTimeRef.current,
      });
    };
    window.addEventListener("beforeunload", handleHide);
    // Save when tab is hidden — but do NOT clear endTimeRef here.
    document.addEventListener("visibilitychange", handleHide);
    return () => {
      window.removeEventListener("beforeunload", handleHide);
      document.removeEventListener("visibilitychange", handleHide);
      handleHide();
    };
  }, []); // ← empty deps: this effect must never re-register (old code re-registered on every isRunning change, leaving stale listeners alive)

  // Re-sync display when the tab becomes visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && endTimeRef.current !== null) {
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        const clamped = Math.max(0, remaining);
        setSecondsLeft(clamped);
        secondsLeftRef.current = clamped;
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const playSound = useCallback((type: "work" | "break") => {
    if (!settingsRef.current.soundEnabled) return;
    try {
      const AudioCtx = (window as any).webkitAudioContext ?? window.AudioContext;
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

  const advance = useCallback((isSkip: boolean) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    endTimeRef.current = null;
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
      sendNotification(
        "Focus session complete! 🎉",
        isSkip
          ? `You studied for ${actualMinutes} min. Take a break!`
          : `${s.workMinutes}-min session done. Break time!`
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

  // ── Core timer — wall-clock based ──────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Only clear anchor if we're genuinely pausing, not on initial mount
      // when we might have a restored endTime from persisted state.
      // We detect "pause" by checking if endTimeRef is set and isRunning just turned false.
      // The reset() and advance() functions already clear endTimeRef themselves,
      // so we only need to clear it here when the user hits pause.
      // BUG FIX 5: Do NOT clear endTimeRef here unconditionally — that was
      // wiping the restored anchor on every mount when isRunning=false.
      return;
    }

    // If we have a valid future endTime (restored from persisted state),
    // keep it. Otherwise anchor from current secondsLeft.
    if (!endTimeRef.current || endTimeRef.current <= Date.now()) {
      endTimeRef.current = Date.now() + secondsLeftRef.current * 1000;
    }

    intervalRef.current = setInterval(() => {
      const remaining = Math.round((endTimeRef.current! - Date.now()) / 1000);

      if (remaining <= 0) {
        if (phaseRef.current === "work") {
          workSecondsElapsedRef.current = settingsRef.current.workMinutes * 60;
        }
        setSecondsLeft(0);
        secondsLeftRef.current = 0;
        setTimeout(() => advance(false), 0);
        return;
      }

      if (phaseRef.current === "work") {
        const totalWork = settingsRef.current.workMinutes * 60;
        workSecondsElapsedRef.current = totalWork - remaining;
      }

      setSecondsLeft(remaining);
      secondsLeftRef.current = remaining;
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, advance]);

  const start = useCallback(() => {
    requestNotificationPermission();
    setIsRunning(true);
  }, [requestNotificationPermission]);

  const pause = useCallback(() => {
    // Capture remaining time before clearing the anchor
    if (endTimeRef.current) {
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      const clamped = Math.max(0, remaining);
      setSecondsLeft(clamped);
      secondsLeftRef.current = clamped;
    }
    endTimeRef.current = null; // Clear anchor on explicit pause
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    endTimeRef.current = null;
    setIsRunning(false);
    workSecondsElapsedRef.current = 0;
    const s = settingsRef.current;
    const secs =
      phaseRef.current === "work" ? s.workMinutes * 60
        : phaseRef.current === "break" ? s.breakMinutes * 60
          : s.longBreakMinutes * 60;
    setSecondsLeft(secs);
    secondsLeftRef.current = secs;
    clearState();
  }, []);

  const skipPhase = useCallback(() => advance(true), [advance]);

  const setPhaseManually = useCallback((p: PomodoroPhase) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    endTimeRef.current = null;
    setIsRunning(false);
    workSecondsElapsedRef.current = 0;
    setPhase(p);
    const s = settingsRef.current;
    const secs =
      p === "work" ? s.workMinutes * 60
        : p === "break" ? s.breakMinutes * 60
          : s.longBreakMinutes * 60;
    setSecondsLeft(secs);
    secondsLeftRef.current = secs;
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