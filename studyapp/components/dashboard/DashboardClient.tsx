"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMinutes } from "@/lib/utils";
import { getLevelInfo, PRIORITY_CONFIG } from "@/types";
import { useLanguage } from "@/components/providers/LanguageContext";
import {
  Timer, Flame, CheckSquare, BookOpen,
  ArrowRight, Trophy, TrendingUp, Clock, Target,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { Profile, Todo, Subject } from "@/types";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface DashboardClientProps {
  profile: Profile;
  todayTodos: Todo[];
  pendingTodos: Todo[];
  todayMinutes: number;
  weekMinutes: number;
  completedTodosToday: number;
  pomodorosToday: number;
  recentAchievements: any[];
  subjects: Subject[];
  chartData: Array<{ day: string; minutes: number; sessions: number }>;
}

export function DashboardClient({
  profile,
  todayTodos,
  pendingTodos,
  todayMinutes,
  weekMinutes,
  completedTodosToday,
  pomodorosToday,
  recentAchievements,
  subjects,
  chartData,
}: DashboardClientProps) {
  const levelInfo = getLevelInfo(profile?.xp ?? 0);
  const { t, isRTL, language } = useLanguage();
  usePushNotifications();

  const stats = [
    {
      label: t("stat_studied_today"),
      value: formatMinutes(todayMinutes),
      icon: Clock,
      sub: `${formatMinutes(weekMinutes)} ${t("stat_this_week")}`,
    },
    {
      label: t("stat_pomodoros"),
      value: pomodorosToday,
      icon: Timer,
      sub: t("stat_sessions_today"),
    },
    {
      label: t("stat_tasks_done"),
      value: completedTodosToday,
      icon: CheckSquare,
      sub: `${pendingTodos.length} ${t("stat_remaining")}`,
    },
    {
      label: t("stat_study_streak"),
      value: profile.streak_current,
      icon: Flame,
      sub: `${t("stat_best")}: ${profile.streak_longest} ${t("stat_days")}`,
    },
  ];

  // Localize chart day labels
  const localizedChartData = chartData.map((d) => ({
    ...d,
    day: language === "en" ? d.day : new Date(
      Date.now() - (chartData.length - 1 - chartData.indexOf(d)) * 86400000
    ).toLocaleDateString(
      language === "ar" ? "ar-DZ" : "fr-FR",
      { weekday: "short" }
    ),
  }));

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>
                  {stat.label}
                </p>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Study chart */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium" dir={isRTL ? "rtl" : "ltr"}>{t("dash_weekly_study")}</CardTitle>
              </div>
              <Badge variant="muted">
                {formatMinutes(weekMinutes)} {t("dash_total")}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={localizedChartData}>
                    <defs>
                      <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }}
                      formatter={(value) => [`${value} min`, t("dash_study_time")]}
                    />
                    <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#studyGradient)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Today's tasks */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium" dir={isRTL ? "rtl" : "ltr"}>{t("dash_todays_tasks")}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/todos">{t("dash_view_all")} <ArrowRight className="w-3 h-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingTodos.length === 0 ? (
                <EmptyState icon={CheckSquare} title={t("dash_all_done")} className="py-8" />
              ) : (
                pendingTodos.map((todo) => {
                  const pConfig = PRIORITY_CONFIG[todo.priority];
                  return (
                    <div key={todo.id} className="flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-muted/50">
                      <div className="h-5 w-5 shrink-0 rounded-md border-2 border-border" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" dir={isRTL ? "rtl" : "ltr"}>{todo.title}</p>
                        {todo.due_date && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t("dash_due")} {new Date(todo.due_date).toLocaleDateString(
                              language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US"
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {todo.subject && <div className="h-2 w-2 rounded-full" style={{ background: todo.subject.color }} />}
                        <span className={`text-xs font-medium ${pConfig.color}`}>{pConfig.label}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <Button variant="outline" className="mt-2 w-full" asChild>
                <Link href="/todos">
                  <Target className="w-4 h-4" />
                  {t("dash_manage_tasks")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* XP & Level */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium" dir={isRTL ? "rtl" : "ltr"}>{t("dash_your_progress")}</CardTitle>
              <Badge variant="secondary">{t("dash_level")} {levelInfo.level}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="font-mono text-muted-foreground">{levelInfo.currentXp} XP</span>
                <span className="text-muted-foreground">{levelInfo.xpForNextLevel} {t("dash_xp_needed")}</span>
              </div>
              <Progress value={levelInfo.xpProgress} className="h-1.5" />
              <p className="text-center text-xs text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>
                {levelInfo.xpProgress}% {t("dash_to_level")} {levelInfo.level + 1}
              </p>
              <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight">{profile.xp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t("dash_total_xp")}</p>
                </div>
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight">{formatMinutes(profile.total_study_minutes)}</p>
                  <p className="text-xs text-muted-foreground">{t("dash_studied")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium" dir={isRTL ? "rtl" : "ltr"}>{t("dash_quick_start")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/pomodoro", label: t("dash_start_pomodoro"), icon: Timer, desc: t("dash_focus_session") },
                { href: "/todos?new=true", label: t("dash_add_task"), icon: CheckSquare, desc: t("dash_track_work") },
                { href: "/quiz", label: t("dash_generate_quiz"), icon: BookOpen, desc: t("dash_from_pdf") },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 rounded-md border border-border/70 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" dir={isRTL ? "rtl" : "ltr"}>{item.label}</p>
                    <p className="text-xs text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>{item.desc}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent achievements */}
          {recentAchievements.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium" dir={isRTL ? "rtl" : "ltr"}>{t("dash_recent_badges")}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/achievements"><ArrowRight className="w-3 h-3" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAchievements.map((ua) => (
                  <div key={ua.id} className="flex items-center gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{ua.achievement?.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">+{ua.achievement?.xp_reward} XP</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Subjects */}
          {subjects.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" dir={isRTL ? "rtl" : "ltr"}>{t("dash_top_subjects")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjects.map((subject) => {
                  const maxMinutes = subjects[0]?.total_minutes ?? 1;
                  return (
                    <div key={subject.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: subject.color }} />
                          <span className="font-medium">{subject.name}</span>
                        </div>
                        <span className="font-mono text-muted-foreground">{formatMinutes(subject.total_minutes)}</span>
                      </div>
                      <Progress value={(subject.total_minutes / maxMinutes) * 100} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
