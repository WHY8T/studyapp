"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Play, Pause, RotateCcw, Coffee, Brain, X, SkipForward, Timer } from "lucide-react";

type Mode = "work" | "short" | "long";

const MODES: Record<Mode, { label: string; seconds: number; color: string; shortLabel: string }> = {
    work: { label: "Focus", seconds: 25 * 60, color: "#00b7ff", shortLabel: "Focus" },
    short: { label: "Short Break", seconds: 5 * 60, color: "#4ECDC4", shortLabel: "5m" },
    long: { label: "Long Break", seconds: 15 * 60, color: "#FF6B6B", shortLabel: "15m" },
};

const LS_KEY = "nahda-edu:floating-pom";

function fmt(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function load(): { mode: Mode; remaining: number; running: boolean; savedAt: number } | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (p.running && p.savedAt) {
            const elapsed = Math.floor((Date.now() - p.savedAt) / 1000);
            p.remaining = Math.max(0, p.remaining - elapsed);
        }
        return p;
    } catch { return null; }
}

function save(mode: Mode, remaining: number, running: boolean) {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ mode, remaining, running, savedAt: Date.now() })); } catch { }
}

export default function FloatingPomodoro() {
    const pathname = usePathname();
    const onPomodoroPage = pathname === "/pomodoro";

    const persisted = typeof window !== "undefined" ? load() : null;
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>(persisted?.mode ?? "work");
    const [remaining, setRemaining] = useState(persisted?.remaining ?? MODES.work.seconds);
    const [running, setRunning] = useState(persisted?.running ?? false);
    const [pulse, setPulse] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { color, seconds } = MODES[mode];
    const progress = 1 - remaining / seconds;
    const circumference = 2 * Math.PI * 20;
    const dash = circumference * progress;

    // Persist on change
    useEffect(() => { save(mode, remaining, running); }, [mode, remaining, running]);

    // Tick
    useEffect(() => {
        if (!running) { clearInterval(intervalRef.current!); return; }
        intervalRef.current = setInterval(() => {
            setRemaining((r) => {
                if (r <= 1) {
                    clearInterval(intervalRef.current!);
                    setRunning(false);
                    // Auto-advance mode
                    setMode((m) => m === "work" ? "short" : "work");
                    return 0;
                }
                return r - 1;
            });
        }, 1000);
        return () => clearInterval(intervalRef.current!);
    }, [running]);

    // Reset when mode changes
    const switchMode = useCallback((m: Mode) => {
        setRunning(false);
        setMode(m);
        setRemaining(MODES[m].seconds);
    }, []);

    const reset = useCallback(() => {
        setRunning(false);
        setRemaining(MODES[mode].seconds);
    }, [mode]);

    const skip = useCallback(() => {
        setRunning(false);
        const next: Mode = mode === "work" ? "short" : "work";
        setMode(next);
        setRemaining(MODES[next].seconds);
    }, [mode]);

    // Pulse effect when timer completes
    useEffect(() => {
        if (remaining === 0) { setPulse(true); setTimeout(() => setPulse(false), 1500); }
    }, [remaining]);

    // Don't show on pomodoro page
    if (onPomodoroPage) return null;

    const isComplete = remaining === 0;

    return (
        <>
            {/* ── Expanded panel ───────────────────────────────────────── */}
            {open && (
                <div
                    className="fixed bottom-24 right-5 z-50 w-60 rounded-2xl border border-white/10 bg-[#0e0e1a]/96 backdrop-blur-2xl shadow-2xl overflow-hidden"
                    style={{ boxShadow: `0 8px 60px ${color}22, 0 0 0 1px ${color}15` }}
                >
                    {/* Colour accent bar */}
                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

                    <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Timer className="w-3.5 h-3.5" style={{ color }} />
                                <span className="text-xs font-black uppercase tracking-widest" style={{ color }}>Pomodoro</span>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Mode tabs */}
                        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                            {(["work", "short", "long"] as Mode[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all duration-200"
                                    style={
                                        mode === m
                                            ? { background: MODES[m].color, color: "#000", boxShadow: `0 0 12px ${MODES[m].color}50` }
                                            : { color: "rgba(255,255,255,0.25)" }
                                    }
                                >
                                    {MODES[m].shortLabel}
                                </button>
                            ))}
                        </div>

                        {/* Timer ring */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-28 h-28">
                                {/* Glow layer */}
                                {running && (
                                    <div
                                        className="absolute inset-0 rounded-full opacity-20 blur-xl"
                                        style={{ background: color }}
                                    />
                                )}
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                                    <circle
                                        cx="24" cy="24" r="20" fill="none"
                                        stroke={color} strokeWidth="3.5" strokeLinecap="round"
                                        strokeDasharray={`${dash} ${circumference}`}
                                        style={{ transition: "stroke-dasharray 0.6s ease", filter: `drop-shadow(0 0 6px ${color}80)` }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="font-mono font-black text-xl text-white tabular-nums leading-none tracking-tight">
                                        {fmt(remaining)}
                                    </span>
                                    <span className="text-[9px] mt-1 font-semibold uppercase tracking-wider" style={{ color: `${color}99` }}>
                                        {isComplete ? "Done! 🎉" : MODES[mode].label}
                                    </span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={reset}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition-all"
                                    style={{ background: "rgba(255,255,255,0.05)" }}
                                    title="Reset"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>

                                <button
                                    onClick={() => setRunning((r) => !r)}
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-200 active:scale-95 shadow-lg"
                                    style={{
                                        background: running
                                            ? `rgba(255,255,255,0.1)`
                                            : color,
                                        color: running ? "white" : "#000",
                                        boxShadow: running ? "none" : `0 0 20px ${color}60`,
                                        border: running ? `1px solid ${color}40` : "none",
                                    }}
                                    title={running ? "Pause" : "Start"}
                                >
                                    {running
                                        ? <Pause className="w-5 h-5" />
                                        : <Play className="w-5 h-5 translate-x-0.5" />}
                                </button>

                                <button
                                    onClick={skip}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition-all"
                                    style={{ background: "rgba(255,255,255,0.05)" }}
                                    title="Skip"
                                >
                                    <SkipForward className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Status hint */}
                        <p className="text-center text-[10px] text-white/20 pb-1">
                            {running
                                ? mode === "work" ? "🧠 Stay focused…" : "☕ Rest up!"
                                : "Press play to start"}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Floating bubble ───────────────────────────────────────── */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="fixed bottom-5 right-20 z-50 w-13 h-13 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                style={{
                    width: 52, height: 52,
                    background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}77)`,
                    boxShadow: `0 0 ${pulse ? "40px" : "20px"} ${color}${pulse ? "90" : "50"}, 0 4px 20px rgba(0,0,0,0.4)`,
                    transition: "all 0.3s ease",
                }}
                title="Pomodoro Timer"
            >
                {/* Mini progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="3" />
                    <circle
                        cx="24" cy="24" r="20" fill="none"
                        stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${dash} ${circumference}`}
                        style={{ transition: "stroke-dasharray 0.6s ease" }}
                    />
                </svg>
                <span className="relative font-mono font-black text-[9px] text-white tabular-nums leading-none text-center">
                    {running ? fmt(remaining) : "🍅"}
                </span>
            </button>
        </>
    );
}