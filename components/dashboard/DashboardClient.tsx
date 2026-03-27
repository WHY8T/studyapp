"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatMinutes } from "@/lib/utils";
import { getLevelInfo, PRIORITY_CONFIG } from "@/types";
import { useLanguage } from "@/components/providers/LanguageContext";
import {
  Timer, Flame, CheckSquare, Zap, BookOpen,
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
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      sub: `${formatMinutes(weekMinutes)} ${t("stat_this_week")}`,
    },
    {
      label: t("stat_pomodoros"),
      value: pomodorosToday,
      icon: Timer,
      color: "text-lime",
      bg: "bg-lime/10",
      sub: t("stat_sessions_today"),
    },
    {
      label: t("stat_tasks_done"),
      value: completedTodosToday,
      icon: CheckSquare,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      sub: `${pendingTodos.length} ${t("stat_remaining")}`,
    },
    {
      label: t("stat_study_streak"),
      value: `${profile.streak_current}🔥`,
      icon: Flame,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide" dir={isRTL ? "rtl" : "ltr"}>
                  {stat.label}
                </p>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="font-display font-black text-2xl">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1" dir={isRTL ? "rtl" : "ltr"}>{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Study chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base" dir={isRTL ? "rtl" : "ltr"}>{t("dash_weekly_study")}</CardTitle>
                <Badge variant="muted" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {formatMinutes(weekMinutes)} {t("dash_total")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={localizedChartData}>
                    <defs>
                      <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00b7ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00b7ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                      formatter={(value) => [`${value} min`, t("dash_study_time")]}
                    />
                    <Area type="monotone" dataKey="minutes" stroke="#00b7ff" strokeWidth={2} fill="url(#studyGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Today's tasks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base" dir={isRTL ? "rtl" : "ltr"}>{t("dash_todays_tasks")}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/todos">{t("dash_view_all")} <ArrowRight className="w-3 h-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingTodos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t("dash_all_done")}</p>
                </div>
              ) : (
                pendingTodos.map((todo) => {
                  const pConfig = PRIORITY_CONFIG[todo.priority];
                  return (
                    <div key={todo.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                      <div className="w-5 h-5 rounded-md border-2 border-border group-hover:border-lime transition-colors shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" dir={isRTL ? "rtl" : "ltr"}>{todo.title}</p>
                        {todo.due_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("dash_due")} {new Date(todo.due_date).toLocaleDateString(
                              language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US"
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {todo.subject && <div className="w-2 h-2 rounded-full" style={{ background: todo.subject.color }} />}
                        <span className={`text-xs font-medium ${pConfig.color}`}>{pConfig.label}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <Button variant="outline" className="w-full mt-2" asChild>
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
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-lime via-lime-400 to-lime-600" />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium" dir={isRTL ? "rtl" : "ltr"}>{t("dash_your_progress")}</p>
                  <p className="font-display font-black text-xl mt-1" dir={isRTL ? "rtl" : "ltr"}>
                    {t("dash_level")} {levelInfo.level}
                  </p>
                </div>
                <div className="level-badge text-2xl w-14 h-14 text-xl">{levelInfo.level}</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{levelInfo.currentXp} XP</span>
                  <span className="text-lime font-semibold">{levelInfo.xpForNextLevel} {t("dash_xp_needed")}</span>
                </div>
                <Progress value={levelInfo.xpProgress} className="h-2.5" />
                <p className="text-xs text-center text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>
                  {levelInfo.xpProgress}% {t("dash_to_level")} {levelInfo.level + 1}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="font-display font-bold text-lg text-lime">{profile.xp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t("dash_total_xp")}</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="font-display font-bold text-lg">{formatMinutes(profile.total_study_minutes)}</p>
                  <p className="text-xs text-muted-foreground">{t("dash_studied")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base" dir={isRTL ? "rtl" : "ltr"}>{t("dash_quick_start")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/pomodoro", label: t("dash_start_pomodoro"), icon: Timer, desc: t("dash_focus_session"), color: "bg-lime text-[#0D0D18]" },
                { href: "/todos?new=true", label: t("dash_add_task"), icon: CheckSquare, desc: t("dash_track_work"), color: "bg-muted text-foreground" },
                { href: "/quiz", label: t("dash_generate_quiz"), icon: BookOpen, desc: t("dash_from_pdf"), color: "bg-muted text-foreground" },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-xl ${item.color} transition-all hover:opacity-90 hover:-translate-y-0.5`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold" dir={isRTL ? "rtl" : "ltr"}>{item.label}</p>
                    <p className="text-xs opacity-70" dir={isRTL ? "rtl" : "ltr"}>{item.desc}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent achievements */}
          {recentAchievements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base" dir={isRTL ? "rtl" : "ltr"}>{t("dash_recent_badges")}</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/achievements"><ArrowRight className="w-3 h-3" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentAchievements.map((ua) => (
                  <div key={ua.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-lg bg-lime/20 flex items-center justify-center text-lg">🏆</div>
                    <div>
                      <p className="text-sm font-semibold">{ua.achievement?.name}</p>
                      <p className="text-xs text-muted-foreground">+{ua.achievement?.xp_reward} XP</p>
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
                <CardTitle className="text-base" dir={isRTL ? "rtl" : "ltr"}>{t("dash_top_subjects")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjects.map((subject) => {
                  const maxMinutes = subjects[0]?.total_minutes ?? 1;
                  return (
                    <div key={subject.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: subject.color }} />
                          <span className="font-medium">{subject.name}</span>
                        </div>
                        <span className="text-muted-foreground">{formatMinutes(subject.total_minutes)}</span>
                      </div>
                      <Progress value={(subject.total_minutes / maxMinutes) * 100} className="h-1.5"
                        indicatorClassName=""
                        style={{ "--progress-color": subject.color } as React.CSSProperties}
                      />
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