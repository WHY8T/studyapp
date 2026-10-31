"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage, type Language } from "@/components/providers/LanguageContext";
import { FeedbackButton } from "@/components/layout/FeedbackButton";
import { Card } from "@/components/ui/card";
import {
    Calendar, Library, Calculator, Trophy, BarChart2, Users, BookOpen,
    User, Languages, Sun, MessageSquare, LogOut, ChevronRight,
} from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/nahda_edu_dz";

const COPY = {
    en: {
        tools: "Tools", settings: "Settings", language: "Language", appearance: "Appearance",
        light: "Light", dark: "Dark", feedback: "Send feedback",
        instagram: "Follow us on Instagram", calculator: "Calculator",
    },
    ar: {
        tools: "الأدوات", settings: "الإعدادات", language: "اللغة", appearance: "المظهر",
        light: "فاتح", dark: "داكن", feedback: "أرسل ملاحظاتك",
        instagram: "تابعنا على إنستغرام", calculator: "الحاسبة",
    },
    fr: {
        tools: "Outils", settings: "Paramètres", language: "Langue", appearance: "Apparence",
        light: "Clair", dark: "Sombre", feedback: "Envoyer des commentaires",
        instagram: "Suivez-nous sur Instagram", calculator: "Calculateur",
    },
};

const LANGS: { code: Language; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "ar", label: "AR" },
    { code: "fr", label: "FR" },
];

function InstagramIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
    );
}

export function MoreScreen() {
    const { t, language, setLanguage, isRTL } = useLanguage();
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const c = COPY[language];
    const dir = isRTL ? "rtl" : "ltr";
    const dark = mounted && resolvedTheme === "dark";

    const tools = [
        { href: "/calendar", label: t("nav_calendar"), icon: Calendar },
        { href: "/subjects", label: t("nav_subjects"), icon: Library },
        { href: "/calculator", label: c.calculator, icon: Calculator },
        { href: "/achievements", label: t("nav_achievements"), icon: Trophy },
        { href: "/leaderboard", label: t("nav_leaderboard"), icon: BarChart2 },
        { href: "/friends", label: t("nav_friends"), icon: Users },
        { href: "/showcase", label: t("nav_showcase"), icon: BookOpen },
    ];

    const handleSignOut = async () => {
        await createClient().auth.signOut();
        window.location.href = "/login";
    };

    const row = "flex min-h-12 items-center justify-between gap-3 px-4 py-2.5 text-sm";
    const seg = (active: boolean) =>
        cn(
            "h-8 rounded-md border border-border px-3 text-xs font-semibold transition-colors",
            active ? "bg-muted text-foreground" : "text-muted-foreground"
        );

    return (
        <div className="space-y-6">
            <section className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70" dir={dir}>
                    {c.tools}
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {tools.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex h-12 items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors active:bg-muted"
                        >
                            <Icon className="h-4 w-4 shrink-0 text-primary" />
                            <span className="truncate" dir={dir}>{label}</span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70" dir={dir}>
                    {c.settings}
                </p>
                <Card className="divide-y divide-border">
                    <Link href="/profile" className={row}>
                        <span className="flex items-center gap-2.5" dir={dir}>
                            <User className="h-4 w-4 text-muted-foreground" />
                            {t("nav_profile")}
                        </span>
                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground", isRTL && "rotate-180")} />
                    </Link>

                    <div className={row}>
                        <span className="flex items-center gap-2.5" dir={dir}>
                            <Languages className="h-4 w-4 text-muted-foreground" />
                            {c.language}
                        </span>
                        <div className="flex gap-1">
                            {LANGS.map((l) => (
                                <button
                                    key={l.code}
                                    type="button"
                                    onClick={() => setLanguage(l.code)}
                                    aria-pressed={language === l.code}
                                    className={seg(language === l.code)}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={row}>
                        <span className="flex items-center gap-2.5" dir={dir}>
                            <Sun className="h-4 w-4 text-muted-foreground" />
                            {c.appearance}
                        </span>
                        <div className="flex gap-1">
                            <button type="button" onClick={() => setTheme("light")} aria-pressed={mounted && !dark} className={seg(mounted && !dark)}>
                                {c.light}
                            </button>
                            <button type="button" onClick={() => setTheme("dark")} aria-pressed={dark} className={seg(dark)}>
                                {c.dark}
                            </button>
                        </div>
                    </div>

                    <div className={row}>
                        <span className="flex items-center gap-2.5" dir={dir}>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            {c.feedback}
                        </span>
                        <FeedbackButton />
                    </div>

                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={row}>
                        <span className="flex items-center gap-2.5" dir={dir}>
                            <InstagramIcon className="h-4 w-4 text-muted-foreground" />
                            {c.instagram}
                        </span>
                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground", isRTL && "rotate-180")} />
                    </a>

                    <button type="button" onClick={handleSignOut} className={cn(row, "w-full text-destructive")}>
                        <span className="flex items-center gap-2.5" dir={dir}>
                            <LogOut className="h-4 w-4" />
                            {t("nav_signout")}
                        </span>
                    </button>
                </Card>
            </section>
        </div>
    );
}