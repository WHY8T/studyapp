"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageContext";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { LayoutDashboard, Timer, Sparkles, CheckSquare, Menu } from "lucide-react";

const MORE_LABEL = { en: "More", ar: "المزيد", fr: "Plus" } as const;

export function AppShell({
    children,
    floating,
}: {
    children: React.ReactNode;
    floating?: React.ReactNode;
}) {
    const pathname = usePathname();
    const { t, language } = useLanguage();

    const tabs = [
        { href: "/dashboard", label: t("nav_dashboard"), icon: LayoutDashboard },
        { href: "/pomodoro", label: t("nav_pomodoro"), icon: Timer },
        { href: "/quiz", label: t("nav_quiz"), icon: Sparkles },
        { href: "/todos", label: t("nav_tasks"), icon: CheckSquare },
        { href: "/more", label: MORE_LABEL[language], icon: Menu },
    ];

    // Any page that is not one of the first four tabs (calendar, profile...) highlights "More"
    const matched = tabs
        .slice(0, 4)
        .find((tab) => pathname === tab.href || pathname.startsWith(tab.href + "/"));
    const activeHref = matched ? matched.href : "/more";

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
                <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
                        N
                    </span>
                    <span className="font-display text-base font-semibold tracking-tight">Nahda.Edu</span>
                </div>
                <NotificationBell />
            </header>

            <main
                className="flex-1 overflow-y-auto scrollbar-thin"
                style={{ overscrollBehavior: "none" }}
            >
                <div className="p-4">{children}</div>
            </main>

            <nav
                className="shrink-0 border-t border-border bg-background"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
                <div className="grid grid-cols-5">
                    {tabs.map(({ href, label, icon: Icon }) => {
                        const active = href === activeHref;
                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                                    active ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="max-w-full truncate px-1">{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* The chat and timer bubbles sit above the bottom bar, not on top of it */}
            {floating && (
                <div
                    className="pointer-events-none fixed bottom-14 left-0 right-0 top-0 z-[60] [&>*]:pointer-events-auto"
                    style={{ transform: "translateZ(0)" }}
                >
                    {floating}
                </div>
            )}
        </div>
    );
}