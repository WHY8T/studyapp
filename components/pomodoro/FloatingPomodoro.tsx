"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Play, Pause, RotateCcw, SkipForward, X, Timer } from "lucide-react";

type Mode = "work" | "short" | "long";

const MODES: Record<Mode, { label: string; seconds: number; accent: string }> = {
    work: { label: "Focus", seconds: 25 * 60, accent: "#00b7ff" },
    short: { label: "Short Break", seconds: 5 * 60, accent: "#4ECDC4" },
    long: { label: "Long Break", seconds: 15 * 60, accent: "#a78bfa" },
};

const LS_KEY = "nahda-edu:floating-pom";
const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

export default function FloatingPomodoro() {
    const pathname = usePathname();
    const onPomodoroPage = pathname === "/pomodoro";

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>("work");
    const [remaining, setRemaining] = useState(MODES.work.seconds);
    const [running, setRunning] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
    const didDrag = useRef(false);

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

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem(LS_KEY, JSON.stringify({ mode, remaining, running, savedAt: Date.now() }));
        window.dispatchEvent(new CustomEvent("pomodoro-sync", { detail: { mode, remaining, running } }));
    }, [mode, remaining, running, mounted]);

    useEffect(() => {
        if (!running) { clearInterval(intervalRef.current!); return; }
        intervalRef.current = setInterval(() => {
            setRemaining((r) => {
                if (r <= 1) {
                    clearInterval(intervalRef.current!);
                    setRunning(false);
                    setMode((m) => (m === "work" ? "short" : "work"));
                    return 0;
                }
                return r - 1;
            });
        }, 1000);
        return () => clearInterval(intervalRef.current!);
    }, [running]);

    const switchMode = useCallback((m: Mode) => {
        setRunning(false); setMode(m); setRemaining(MODES[m].seconds);
    }, []);
    const reset = useCallback(() => {
        setRunning(false); setRemaining(MODES[mode].seconds);
    }, [mode]);
    const skip = useCallback(() => {
        const next: Mode = mode === "work" ? "short" : "work";
        setRunning(false); setMode(next); setRemaining(MODES[next].seconds);
    }, [mode]);

    // ── Drag handlers ──────────────────────────────────────────────────
    const onPointerDown = (e: React.PointerEvent) => {
        dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
        didDrag.current = false;
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragStart.current) return;
        const dx = e.clientX - dragStart.current.mx;
        const dy = e.clientY - dragStart.current.my;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true;
        setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
    };
    const onPointerUp = () => {
        dragStart.current = null;
        setDragging(false);
        if (!didDrag.current) setOpen((o) => !o);
    };

    const hideWidget = pathname === "/pomodoro";
    if (!mounted || hideWidget) return null;

    const { accent, seconds, label } = MODES[mode];
    const progress = 1 - remaining / seconds;
    const circumference = 2 * Math.PI * 18;
    const dash = circumference * progress;

    return (
        <>
            {open && (
                <div
                    onPointerDown={e => e.stopPropagation()}
                    onPointerMove={e => e.stopPropagation()}
                    onPointerUp={e => e.stopPropagation()}
                    className="fixed bottom-20 right-5 z-50 w-56 rounded-2xl overflow-hidden"
                    style={{
                        background: "#0c0c18",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
                    }}
                >
                    <div style={{ height: 2, background: accent, opacity: 0.9 }} />
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Timer className="w-3 h-3" style={{ color: accent }} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: accent }}>
                                    Pomodoro
                                </span>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-5 h-5 rounded-md flex items-center justify-center"
                                style={{ color: "rgba(255,255,255,0.25)" }}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                            {(["work", "short", "long"] as Mode[]).map((m) => (
                                <button key={m} onClick={() => switchMode(m)}
                                    className="flex-1 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-150"
                                    style={mode === m
                                        ? { background: MODES[m].accent, color: "#000" }
                                        : { color: "rgba(255,255,255,0.2)" }}>
                                    {m === "work" ? "Focus" : m === "short" ? "5m" : "15m"}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <div className="relative w-24 h-24">
                                <svg className="w-full h-full" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
                                    <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                    <circle cx="24" cy="24" r="18" fill="none" stroke={accent} strokeWidth="3"
                                        strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`}
                                        style={{ transition: "stroke-dasharray 0.5s ease" }} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="font-mono font-black text-lg text-white leading-none tabular-nums">
                                        {fmt(remaining)}
                                    </span>
                                    <span className="text-[8px] font-semibold mt-0.5 uppercase tracking-wider"
                                        style={{ color: `${accent}99` }}>
                                        {label}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={reset}
                                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                                    <RotateCcw className="w-3 h-3" />
                                </button>

                                {/* ── Play / Pause ── */}
                                <button
                                    onClick={() => setRunning((r) => !r)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95"
                                    style={running
                                        ? { background: "rgba(255,255,255,0.08)", color: "white", border: `1px solid ${accent}40` }
                                        : { background: accent, color: "#000" }}>
                                    {running
                                        ? <Pause className="w-4 h-4" />
                                        : <Play className="w-4 h-4 translate-x-px" />}
                                </button>

                                <button onClick={skip}
                                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                                    <SkipForward className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <p className="text-center text-[9px] pb-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>
                            {running
                                ? mode === "work" ? "Stay focused" : "Take it easy"
                                : remaining === 0 ? "Session complete" : "Ready when you are"}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Draggable FAB ── */}
            <button
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl"
                style={{
                    height: 44,
                    paddingInline: "14px",
                    background: "#0c0c18",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: running
                        ? `0 0 0 1px ${accent}40, 0 8px 24px rgba(0,0,0,0.5)`
                        : "0 4px 16px rgba(0,0,0,0.4)",
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    cursor: dragging ? "grabbing" : "grab",
                    userSelect: "none",
                    touchAction: "none",
                }}
            >
                <div className="relative w-5 h-5 shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 24 24" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                        <circle cx="12" cy="12" r="9" fill="none" stroke={accent} strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={`${(2 * Math.PI * 9) * progress} ${2 * Math.PI * 9}`}
                            style={{ transition: "stroke-dasharray 0.5s ease" }} />
                    </svg>
                </div>
                <span className="font-mono text-xs font-bold text-white tabular-nums">{fmt(remaining)}</span>
                {running && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />}
            </button>
        </>
    );
}