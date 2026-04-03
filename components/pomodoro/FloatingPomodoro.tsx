"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, X } from "lucide-react";

type Mode = "work" | "short" | "long";

const MODES: Record<Mode, { label: string; seconds: number; color: string }> = {
    work: { label: "Focus", seconds: 25 * 60, color: "#00b7ff" },
    short: { label: "Short Break", seconds: 5 * 60, color: "#10b981" },
    long: { label: "Long Break", seconds: 15 * 60, color: "#8b5cf6" },
};

function fmt(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
}

export default function FloatingPomodoro() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>("work");
    const [remaining, setRemaining] = useState(MODES.work.seconds);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { color, seconds } = MODES[mode];

    const reset = useCallback(() => {
        setRunning(false);
        setRemaining(MODES[mode].seconds);
    }, [mode]);

    // Switch mode resets timer
    const switchMode = (m: Mode) => {
        setRunning(false);
        setMode(m);
        setRemaining(MODES[m].seconds);
    };

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setRemaining((r) => {
                    if (r <= 1) {
                        clearInterval(intervalRef.current!);
                        setRunning(false);
                        return 0;
                    }
                    return r - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current!);
        }
        return () => clearInterval(intervalRef.current!);
    }, [running]);

    const progress = 1 - remaining / seconds;
    const circumference = 2 * Math.PI * 20; // r=20
    const dash = circumference * progress;

    return (
        <>
            {/* Expanded panel */}
            {open && (
                <div
                    className="fixed bottom-24 right-5 z-50 w-56 rounded-2xl border border-white/10 bg-[#0e0e1a]/95 backdrop-blur-xl shadow-2xl p-4 space-y-4"
                    style={{ boxShadow: `0 0 40px ${color}18` }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
                            Pomodoro
                        </span>
                        <button
                            onClick={() => setOpen(false)}
                            className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Mode tabs */}
                    <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                        {(["work", "short", "long"] as Mode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                className="flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all"
                                style={mode === m ? { background: MODES[m].color, color: "#000" } : { color: "#ffffff40" }}
                            >
                                {m === "work" ? "Focus" : m === "short" ? "5m" : "15m"}
                            </button>
                        ))}
                    </div>

                    {/* Timer ring */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative w-24 h-24">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                                <circle
                                    cx="24" cy="24" r="20" fill="none"
                                    stroke={color} strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeDasharray={`${dash} ${circumference}`}
                                    style={{ transition: "stroke-dasharray 0.4s ease" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-mono font-black text-lg text-white tabular-nums leading-none">
                                    {fmt(remaining)}
                                </span>
                                <span className="text-[9px] text-white/30 mt-0.5">{MODES[mode].label}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={reset}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setRunning((r) => !r)}
                                className="px-5 py-2 rounded-xl font-bold text-sm text-black transition-all shadow-lg"
                                style={{ background: color, boxShadow: `0 0 16px ${color}40` }}
                            >
                                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => switchMode(mode === "work" ? "short" : "work")}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                            >
                                {mode === "work" ? <Coffee className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating bubble */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="fixed bottom-5 right-20 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${color}cc, ${color}88)`, boxShadow: `0 0 24px ${color}50` }}
                title="Pomodoro Timer"
            >
                {/* Mini ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="3" />
                    <circle
                        cx="24" cy="24" r="20" fill="none"
                        stroke="rgba(255,255,255,0.6)" strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circumference}`}
                        style={{ transition: "stroke-dasharray 0.4s ease" }}
                    />
                </svg>
                <span className="relative font-mono font-black text-[10px] text-white tabular-nums leading-none">
                    {running ? fmt(remaining) : "🍅"}
                </span>
            </button>
        </>
    );
}