"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getLevelInfo } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";
import { useLanguage, type Language } from "@/components/providers/LanguageContext";
import {
  LayoutDashboard, Timer, CheckSquare, Calendar, Sparkles,
  Trophy, Users, User, LogOut, Flame, Zap, BarChart2, X, BookOpen, Library,
  ChevronDown, ChevronUp,
} from "lucide-react";
import type { Profile } from "@/types";
import { Calculator } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/nahda_edu_dz";

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

function useClockTime() {
  const [time, setTime] = useState({ hm: "", hms: "" });
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setTime({ hm: `${h}:${m}`, hms: `${h}:${m}:${s}` });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

interface SidebarProps {
  profile: Profile | null;
  onClose?: () => void;
}

export function Sidebar({ profile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [clockOpen, setClockOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const { hm, hms } = useClockTime();
  const levelInfo = profile ? getLevelInfo(profile.xp) : null;

  // Nav items use t() so they update when language changes
  const NAV_GROUPS = [
    {
      label: t("sidebar_group_study"),
      items: [
        { href: "/dashboard", label: t("nav_dashboard"), icon: LayoutDashboard },
        { href: "/pomodoro", label: t("nav_pomodoro"), icon: Timer },
        { href: "/todos", label: t("nav_tasks"), icon: CheckSquare },
        { href: "/subjects", label: t("nav_subjects"), icon: Library },
        { href: "/calendar", label: t("nav_calendar"), icon: Calendar },
        { href: "/quiz", label: t("nav_quiz"), icon: Sparkles, badge: "AI" },
      ],
    },
    {
      label: t("sidebar_group_social"),
      items: [
        { href: "/achievements", label: t("nav_achievements"), icon: Trophy },
        { href: "/leaderboard", label: t("nav_leaderboard"), icon: BarChart2 },
        { href: "/friends", label: t("nav_friends"), icon: Users },
        { href: "/showcase", label: t("nav_showcase"), icon: BookOpen },
      ],
    },
    {
      label: t("sidebar_group_tools"),
      items: [
        { href: "/calculator", label: "Calculator", icon: Calculator },
        { href: "/profile", label: t("nav_profile"), icon: User },
      ],
    },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setClockOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      <aside className={cn("w-64 shrink-0 h-full flex flex-col bg-background", isRTL ? "border-l" : "border-r", "border-border")}>
        <div className="h-14 shrink-0 px-4 border-b border-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <span className="font-display font-bold text-primary-foreground text-sm">N</span>
            </div>
            <div>
              <p className="font-display font-bold text-sm leading-none">Nahda.Edu</p>
              <p className="text-[11px] text-muted-foreground mt-1">{t("sidebar_tagline")}</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-thin">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className="space-y-0.5">
              <p className={cn("px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60", gi === 0 ? "pt-0.5" : "pt-4")} dir={isRTL ? "rtl" : "ltr"}>
                {group.label}
              </p>
              {group.items.map(({ href, label, icon: Icon, badge }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link key={href} href={href}
                    className={cn(
                      "flex h-8 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors",
                      active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span dir={isRTL ? "rtl" : "ltr"}>{label}</span>
                    {badge && <span className="ms-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {hm && (
          <div className="px-3 pb-2">
            <button onClick={() => setClockOpen(true)} className="w-full flex h-8 items-center justify-center gap-2 rounded-md border border-border hover:bg-muted transition-colors">
              <span suppressHydrationWarning className="font-mono font-bold text-sm text-foreground tracking-widest">{hms}</span>
            </button>
          </div>
        )}

        {profile && levelInfo && (
          <div className="px-3 py-3 border-t border-border">
            <div className="rounded-lg bg-muted/50">
              <button
                type="button"
                onClick={() => setCardOpen((o) => !o)}
                aria-expanded={cardOpen}
                aria-controls="sidebar-user-panel"
                className="flex w-full items-center gap-2 rounded-lg p-3 text-start transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-xs text-primary">
                  {levelInfo.level}
                </span>
                <span className="min-w-0 flex-1 truncate font-display font-semibold text-sm">{profile.username}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  <span className="font-semibold">{profile.xp.toLocaleString()}</span>
                </span>
                {cardOpen
                  ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>

              {cardOpen && (
                <div id="sidebar-user-panel" className="space-y-3 px-3 pb-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{levelInfo.currentXp} XP</span>
                      <span dir={isRTL ? "rtl" : "ltr"}>
                        {levelInfo.xpForNextLevel} {t("sidebar_xp_to_level")} {levelInfo.level + 1}
                      </span>
                    </div>
                    <Progress value={levelInfo.xpProgress} className="h-1.5" />
                  </div>

                  {profile.streak_current > 0 && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary" dir={isRTL ? "rtl" : "ltr"}>
                      <Flame className="h-3 w-3" />
                      {profile.streak_current} {t("sidebar_day_streak")}
                    </span>
                  )}

                  <div className="border-t border-border" />

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>
                      {t("sidebar_language")}
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      {LANGS.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => setLanguage(l.code)}
                          aria-pressed={language === l.code}
                          className={cn(
                            "h-7 rounded-md border border-border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            language === l.code
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("sidebar_follow_instagram")}
                    title={t("sidebar_follow_instagram")}
                    className="flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <InstagramIcon className="h-4 w-4 shrink-0" />
                    <span>@nahda_edu_dz</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-3 py-3 border-t border-border" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={handleSignOut} className="flex h-8 items-center gap-2.5 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors">
            <LogOut className="h-4 w-4" />
            <span dir={isRTL ? "rtl" : "ltr"}>{t("nav_signout")}</span>
          </button>
        </div>
      </aside>

      {clockOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center cursor-pointer" onClick={() => setClockOpen(false)}>
          <button onClick={(e) => { e.stopPropagation(); setClockOpen(false); }} className="absolute top-6 right-6 p-3 rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="space-y-4 text-center select-none">
            <p suppressHydrationWarning className="text-muted-foreground/30 text-sm uppercase tracking-[0.3em] font-semibold">
              {new Date().toLocaleDateString(
                language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US",
                { weekday: "long", month: "long", day: "numeric", year: "numeric" }
              )}
            </p>
            <div suppressHydrationWarning className="font-mono font-bold text-foreground" style={{ fontSize: "clamp(4rem, 14vw, 11rem)", letterSpacing: "-0.02em" }}>
              {hms}
            </div>
            <p className="text-muted-foreground/20 text-sm">{t("clock_close")}</p>
          </div>
        </div>
      )}
    </>
  );
}