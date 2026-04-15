"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage, type Language } from "@/components/providers/LanguageContext";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
    { code: "en" as Language, label: "English", short: "EN" },
    { code: "ar" as Language, label: "العربية", short: "AR" },
    { code: "fr" as Language, label: "Français", short: "FR" },
];

interface LanguageSwitcherProps {
    variant?: "dark" | "default";
}

export function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
    const { language, setLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const current = LANGUAGES.find((l) => l.code === language)!;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    variant === "dark"
                        ? "border border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                        : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
            >
                <Globe className="w-3.5 h-3.5" />
                {/* Text only — no flag emojis, they break on Windows/Chrome */}
                <span className="text-xs font-bold tracking-wide">{current.short}</span>
            </button>

            {open && (
                <div
                    className={cn(
                        "absolute top-full mt-2 right-0 z-50 rounded-xl border shadow-xl overflow-hidden min-w-[130px]",
                        variant === "dark"
                            ? "bg-[#0D0D18] border-white/15"
                            : "bg-card border-border"
                    )}
                >
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => { setLanguage(lang.code); setOpen(false); }}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                                language === lang.code
                                    ? variant === "dark"
                                        ? "bg-lime/10 text-lime font-semibold"
                                        : "bg-primary/10 text-primary font-semibold"
                                    : variant === "dark"
                                        ? "text-white/70 hover:bg-white/5 hover:text-white"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {/* Colored dot instead of flag emoji */}
                            <span className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black",
                                lang.code === "en" ? "bg-blue-500/20 text-blue-400" :
                                    lang.code === "ar" ? "bg-green-500/20 text-green-400" :
                                        "bg-purple-500/20 text-purple-400"
                            )}>
                                {lang.short}
                            </span>
                            <span>{lang.label}</span>
                            {language === lang.code && (
                                <span className="ml-auto text-xs opacity-60">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}