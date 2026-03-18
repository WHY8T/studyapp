
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getLevelInfo } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard, Timer, CheckSquare, Calendar, Sparkles,
  Trophy, Users, User, LogOut, Flame, Zap, BarChart2, X, BookOpen,
} from "lucide-react";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pomodoro", label: "Pomodoro", icon: Timer },
  { href: "/todos", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/quiz", label: "AI Quiz", icon: Sparkles, badge: "Soon" },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart2 },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/showcase", label: "Showcase", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

interface SidebarProps {
  profile: Profile | null;
  onClose?: () => void;
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

export function Sidebar({ profile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [clockOpen, setClockOpen] = useState(false);
  const { hm, hms } = useClockTime();
  const levelInfo = profile ? getLevelInfo(profile.xp) : null;


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setClockOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <aside className="w-64 shrink-0 h-full flex flex-col border-r border-border bg-card">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-lime flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="font-display font-black text-[#0D0D18] text-base">S</span>
            </div>
            <div>
              <p className="font-display font-black text-base leading-none">StudyFlow</p>
              <p className="text-xs text-muted-foreground mt-0.5">Level up your studies</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {profile && levelInfo && (
          <div className="px-4 py-4 border-b border-border">
            <div className="rounded-xl bg-muted/50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="level-badge text-xs">{levelInfo.level}</div>
                  <span className="font-display font-semibold text-sm truncate max-w-[100px]">{profile.username}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3 text-lime" />
                  <span className="text-lime font-semibold">{profile.xp.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{levelInfo.currentXp} XP</span>
                  <span>{levelInfo.xpForNextLevel} XP to level {levelInfo.level + 1}</span>
                </div>
                <Progress value={levelInfo.xpProgress} className="h-1.5" />
              </div>
              {profile.streak_current > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-orange-400 font-semibold">{profile.streak_current} day streak</span>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active ? "bg-lime text-[#0D0D18] font-semibold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", active ? "text-[#0D0D18]" : "")} />
                {label}
                {badge && <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-400/20 text-orange-400">{badge}</span>}
              </Link>
            );
          })}
        </nav>

        {hm && (
          <div className="px-4 pb-2">
            <button onClick={() => setClockOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
              <span className="font-mono font-bold text-base text-foreground tracking-widest">{hms}</span>
            </button>
          </div>
        )}

        <div className="p-4 border-t border-border">
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-all duration-200">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {clockOpen && (
        <div className="fixed inset-0 z-50 bg-[#08080F] flex flex-col items-center justify-center cursor-pointer" onClick={() => setClockOpen(false)}>
          <button onClick={(e) => { e.stopPropagation(); setClockOpen(false); }} className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="space-y-4 text-center select-none">
            <p className="text-white/30 text-sm uppercase tracking-[0.3em] font-semibold">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            <div className="font-mono font-bold text-white" style={{ fontSize: "clamp(4rem, 14vw, 11rem)", letterSpacing: "-0.02em", textShadow: "0 0 80px rgba(0,183,255,0.25)" }}>
              {hms}
            </div>
            <p className="text-white/20 text-sm">Click anywhere to close · Press Esc</p>
          </div>
        </div>
      )}
    </>
  );
}