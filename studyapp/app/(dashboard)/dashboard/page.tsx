import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { Profile, Todo, PomodoroSession } from "@/types";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const weekStart = startOfWeek(now).toISOString();
  const weekEnd = endOfWeek(now).toISOString();

  // Fetch all dashboard data in parallel
  const [
    { data: profile },
    { data: todayTodos },
    { data: pendingTodos },
    { data: todaySessions },
    { data: weekSessions },
    { data: recentAchievements },
    { data: subjects },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("todos")
      .select("*, subject:subjects(*)")
      .eq("user_id", user.id)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd)
      .order("priority", { ascending: false })
      .limit(8),
    supabase
      .from("todos")
      .select("*, subject:subjects(*)")
      .eq("user_id", user.id)
      .eq("completed", false)
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("pomodoro_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("started_at", todayStart)
      .lte("started_at", todayEnd),
    supabase
      .from("pomodoro_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("started_at", weekStart)
      .lte("started_at", weekEnd),
    supabase
      .from("user_achievements")
      .select("*, achievement:achievements(*)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })
      .limit(3),
    supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user.id)
      .order("total_minutes", { ascending: false })
      .limit(5),
  ]);

  // Calculate stats
  const todayMinutes = todaySessions?.reduce((sum, s) => sum + s.duration_minutes, 0) ?? 0;
  const weekMinutes = weekSessions?.reduce((sum, s) => sum + s.duration_minutes, 0) ?? 0;
  const completedTodosToday = todayTodos?.filter((t) => t.completed).length ?? 0;

  // Build 7-day chart data
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = startOfDay(date).toISOString();
    const dayEnd = endOfDay(date).toISOString();
    const daySessions = weekSessions?.filter(
      (s) => s.started_at >= dayStart && s.started_at <= dayEnd
    ) ?? [];
    chartData.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      minutes: daySessions.reduce((sum, s) => sum + s.duration_minutes, 0),
      sessions: daySessions.length,
    });
  }
  if (!profile) redirect("/login");
  return (
    <DashboardClient
      profile={profile as Profile}
      todayTodos={(todayTodos as Todo[]) ?? []}
      pendingTodos={(pendingTodos as Todo[]) ?? []}
      todayMinutes={todayMinutes}
      weekMinutes={weekMinutes}
      completedTodosToday={completedTodosToday}
      pomodorosToday={todaySessions?.length ?? 0}
      recentAchievements={recentAchievements ?? []}
      subjects={subjects ?? []}
      chartData={chartData}
    />
  );
}
