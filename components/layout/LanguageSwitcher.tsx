"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage, type Language } from "@/components/providers/LanguageContext";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
    { code: "en" as Language, label: "English", flag: "🇬🇧", short: "EN" },
    { code: "ar" as Language, label: "العربية", flag: "🇩🇿", short: "AR" },
    { code: "fr" as Language, label: "Français", flag: "🇫🇷", short: "FR" },
];

interface LanguageSwitcherProps {
    // dark = for landing page dark bg, default = for dashboard header
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
                <span className="text-xs font-bold">{current.short}</span>
                <span className="text-xs">{current.flag}</span>
            </button>

            {open && (
                <div
                    className={cn(
                        "absolute top-full mt-2 right-0 z-50 rounded-xl border shadow-xl overflow-hidden min-w-[140px]",
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
                            <span className="text-base">{lang.flag}</span>
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