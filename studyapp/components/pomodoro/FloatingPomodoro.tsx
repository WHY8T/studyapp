"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Play, Pause, RotateCcw, SkipForward, X, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "work" | "short" | "long";

const MODES: Record<Mode, { label: string; seconds: number }> = {
    work: { label: "Focus", seconds: 25 * 60 },
    short: { label: "Short Break", seconds: 5 * 60 },
    long: { label: "Long Break", seconds: 15 * 60 },
};

// Token classes per mode (kept as literal strings so Tailwind can detect them)
const ACCENT: Record<Mode, { text: string; solid: string; stroke: string; dot: string }> = {
    work: { text: "text-primary", solid: "bg-primary text-primary-foreground", stroke: "stroke-primary", dot: "bg-primary" },
    short: { text: "text-success", solid: "bg-success text-success-foreground", stroke: "stroke-success", dot: "bg-success" },
    long: { text: "text-warning", solid: "bg-warning text-warning-foreground", stroke: "stroke-warning", dot: "bg-warning" },
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

    // ✅ Only hide the widget when on the dedicated pomodoro page AND not in PDF fullscreen
    // Hide when chat is open on mobile (chat uses z-50, we use z-[200] which would overlap)
    // The PDF viewer uses z-[100]; we use z-[200] so we always render on top
    if (!mounted || onPomodoroPage) return null;

    const { seconds, label } = MODES[mode];
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
                    // ✅ z-[200] — renders above PDF viewer (z-[100]) and all other overlays
                    className="fixed bottom-20 right-5 z-[60] w-56 rounded-lg overflow-hidden border border-border bg-card sm:z-[200]"
                >
                    <div className={cn("h-0.5", ACCENT[mode].dot)} />
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Timer className={cn("w-3 h-3", ACCENT[mode].text)} />
                                <span className={cn("text-[10px] font-bold uppercase tracking-[0.15em]", ACCENT[mode].text)}>
                                    Pomodoro
                                </span>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="flex rounded-lg p-0.5 gap-0.5 bg-muted/40">
                            {(["work", "short", "long"] as Mode[]).map((m) => (
                                <button key={m} onClick={() => switchMode(m)}
                                    className={cn("flex-1 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-150",
                                        mode === m ? ACCENT[m].solid : "text-muted-foreground")}>
                                    {m === "work" ? "Focus" : m === "short" ? "5m" : "15m"}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <div className="relative w-24 h-24">
                                <svg className="timer-ring w-full h-full" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r="18" fill="none" strokeWidth="3" className="stroke-muted" />
                                    <circle cx="24" cy="24" r="18" fill="none" strokeWidth="3"
                                        strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`}
                                        className={cn("transition-all duration-500", ACCENT[mode].stroke)} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="font-mono font-bold text-lg text-foreground leading-none tabular-nums">
                                        {fmt(remaining)}
                                    </span>
                                    <span className="text-[8px] font-semibold mt-0.5 uppercase tracking-wider text-muted-foreground">
                                        {label}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={reset}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
                                    <RotateCcw className="w-3 h-3" />
                                </button>

                                <button
                                    onClick={() => setRunning((r) => !r)}
                                    className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95",
                                        running ? "bg-muted text-foreground" : ACCENT[mode].solid)}>
                                    {running
                                        ? <Pause className="w-4 h-4" />
                                        : <Play className="w-4 h-4 translate-x-px" />}
                                </button>

                                <button onClick={skip}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
                                    <SkipForward className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <p className="text-center text-[9px] pb-0.5 text-muted-foreground">
                            {running
                                ? mode === "work" ? "Stay focused" : "Take it easy"
                                : remaining === 0 ? "Session complete" : "Ready when you are"}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Draggable FAB ── */}
            {/* ✅ z-[200] — always above the PDF viewer overlay */}
            <button
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className={cn(
                    "fixed bottom-5 right-5 z-[60] flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-3.5 cursor-grab select-none touch-none sm:z-[200]",
                    dragging && "cursor-grabbing"
                )}
                style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
            >
                <div className="relative w-5 h-5 shrink-0">
                    <svg className="timer-ring w-full h-full" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2.5" className="stroke-muted" />
                        <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={`${(2 * Math.PI * 9) * progress} ${2 * Math.PI * 9}`}
                            className={cn("transition-all duration-500", ACCENT[mode].stroke)} />
                    </svg>
                </div>
                <span className="font-mono text-xs font-bold text-foreground tabular-nums">{fmt(remaining)}</span>
                {running && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", ACCENT[mode].dot)} />}
            </button>
        </>
    );
}