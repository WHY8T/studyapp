"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Play, Pause, RotateCcw, X, SkipForward, Timer } from "lucide-react";

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

export default function FloatingPomodoro() {
    const pathname = usePathname();
    const onPomodoroPage = pathname === "/pomodoro";

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>("work");
    const [remaining, setRemaining] = useState(MODES.work.seconds);
    const [running, setRunning] = useState(false);
    const [pulse, setPulse] = useState(false);
    const [mounted, setMounted] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load from localStorage only after mount (fixes hydration error)
    useEffect(() => {
        setMounted(true);
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return;
            const p = JSON.parse(raw);
            if (p.running && p.savedAt) {
                const elapsed = Math.floor((Date.now() - p.savedAt) / 1000);
                p.remaining = Math.max(0, p.remaining - elapsed);
            }
            setMode(p.mode ?? "work");
            setRemaining(p.remaining ?? MODES.work.seconds);
            setRunning(p.running ?? false);
        } catch { }
    }, []);

    // Sync WITH pomodoro page via storage events
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key !== LS_KEY || !e.newValue) return;
            try {
                const p = JSON.parse(e.newValue);
                setMode(p.mode ?? "work");
                setRemaining(p.remaining ?? MODES.work.seconds);
                setRunning(p.running ?? false);
            } catch { }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Persist on change
    useEffect(() => {
        if (!mounted) return;
        try {
            localStorage.setItem(LS_KEY, JSON.stringify({ mode, remaining, running, savedAt: Date.now() }));
        } catch { }
    }, [mode, remaining, running, mounted]);

    // Tick
    useEffect(() => {
        if (!running) { clearInterval(intervalRef.current!); return; }
        intervalRef.current = setInterval(() => {
            setRemaining((r) => {
                if (r <= 1) {
                    clearInterval(intervalRef.current!);
                    setRunning(false);
                    setMode((m) => m === "work" ? "short" : "work");
                    setPulse(true);
                    setTimeout(() => setPulse(false), 1500);
                    return 0;
                }
                return r - 1;
            });
        }, 1000);
        return () => clearInterval(intervalRef.current!);
    }, [running]);

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

    // Don't render until mounted (prevents hydration mismatch)
    if (!mounted || onPomodoroPage) return null;

    const { color, seconds } = MODES[mode];
    const progress = 1 - remaining / seconds;
    const circumference = 2 * Math.PI * 20;
    const dash = circumference * progress;
    const isComplete = remaining === 0;

    return (
        <>
            {open && (
                <div
                    className="fixed bottom-24 right-5 z-50 w-60 rounded-2xl border border-white/10 bg-[#0e0e1a]/96 backdrop-blur-2xl shadow-2xl overflow-hidden"
                    style={{ boxShadow: `0 8px 60px ${color}22, 0 0 0 1px ${color}15` }}
                >
                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Timer className="w-3.5 h-3.5" style={{ color }} />
                                <span className="text-xs font-black uppercase tracking-widest" style={{ color }}>Pomodoro</span>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                            {(["work", "short", "long"] as Mode[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all duration-200"
                                    style={mode === m
                                        ? { background: MODES[m].color, color: "#000", boxShadow: `0 0 12px ${MODES[m].color}50` }
                                        : { color: "rgba(255,255,255,0.25)" }}
                                >
                                    {MODES[m].shortLabel}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-28 h-28">
                                {running && <div className="absolute inset-0 rounded-full opacity-20 blur-xl" style={{ background: color }} />}
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                                    <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
                                        strokeDasharray={`${dash} ${circumference}`}
                                        style={{ transition: "stroke-dasharray 0.6s ease", filter: `drop-shadow(0 0 6px ${color}80)` }} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="font-mono font-black text-xl text-white tabular-nums leading-none tracking-tight">{fmt(remaining)}</span>
                                    <span className="text-[9px] mt-1 font-semibold uppercase tracking-wider" style={{ color: `${color}99` }}>
                                        {isComplete ? "Done! 🎉" : MODES[mode].label}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={reset} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition-all" style={{ background: "rgba(255,255,255,0.05)" }}>
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setRunning((r) => !r)}
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-200 active:scale-95 shadow-lg"
                                    style={{ background: running ? "rgba(255,255,255,0.1)" : color, color: running ? "white" : "#000", boxShadow: running ? "none" : `0 0 20px ${color}60`, border: running ? `1px solid ${color}40` : "none" }}
                                >
                                    {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
                                </button>
                                <button onClick={skip} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition-all" style={{ background: "rgba(255,255,255,0.05)" }}>
                                    <SkipForward className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        <p className="text-center text-[10px] text-white/20 pb-1">
                            {running ? (mode === "work" ? "🧠 Stay focused…" : "☕ Rest up!") : "Press play to start"}
                        </p>
                    </div>
                </div>
            )}

            <button
                onClick={() => setOpen((o) => !o)}
                className="fixed bottom-5 right-20 z-50 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                style={{ width: 52, height: 52, background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}77)`, boxShadow: `0 0 ${pulse ? "40px" : "20px"} ${color}${pulse ? "90" : "50"}, 0 4px 20px rgba(0,0,0,0.4)` }}
            >
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="3" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${dash} ${circumference}`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
                </svg>
                <span className="relative font-mono font-black text-[9px] text-white tabular-nums leading-none text-center">
                    {running ? fmt(remaining) : "🍅"}
                </span>
            </button>
        </>
    );
}