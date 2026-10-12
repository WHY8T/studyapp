import { createClient } from "@/lib/supabase/client";
import { getLevelInfo, XP_PER_LEVEL } from "@/types";

export async function awardXP(
  userId: string,
  amount: number,
  reason: string,
  sourceType?: string,
  sourceId?: string
): Promise<{ newXp: number; leveledUp: boolean; newLevel: number }> {
  const supabase = createClient();

  // Get current profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .single();

  if (!profile) throw new Error("Profile not found");

  const oldLevel = profile.level;
  const newXp = profile.xp + amount;
  const { level: newLevel } = getLevelInfo(newXp);
  const leveledUp = newLevel > oldLevel;

  // Update profile XP and level
  await supabase
    .from("profiles")
    .update({ xp: newXp, level: newLevel })
    .eq("id", userId);

  // Log XP transaction
  await supabase.from("xp_transactions").insert({
    user_id: userId,
    amount,
    reason,
    source_type: sourceType,
    source_id: sourceId,
  });

  return { newXp, leveledUp, newLevel };
}

export async function updateStreak(userId: string): Promise<number> {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_current, streak_longest, streak_last_study")
    .eq("id", userId)
    .single();

  if (!profile) return 0;

  const today = new Date().toISOString().split("T")[0];
  const lastStudy = profile.streak_last_study;

  if (lastStudy === today) {
    return profile.streak_current; // Already updated today
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;
  if (lastStudy === yesterdayStr) {
    newStreak = profile.streak_current + 1;
  } else {
    newStreak = 1; // Streak broken
  }

  const newLongest = Math.max(newStreak, profile.streak_longest);

  await supabase
    .from("profiles")
    .update({
      streak_current: newStreak,
      streak_longest: newLongest,
      streak_last_study: today,
    })
    .eq("id", userId);

  return newStreak;
}

export async function checkAndAwardAchievements(
  userId: string,
  stats: {
    totalMinutes?: number;
    streakDays?: number;
    quizScore?: number;
    quizCount?: number;
    friendCount?: number;
    todoCompleted?: number;
    level?: number;
    nightSession?: boolean;
  }
): Promise<string[]> {
  const supabase = createClient();

  // Get achievements not yet earned
  const { data: earned } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const earnedIds = new Set(earned?.map((e) => e.achievement_id) ?? []);

  const { data: all } = await supabase.from("achievements").select("*");
  if (!all) return [];

  const newlyEarned: string[] = [];

  for (const achievement of all) {
    if (earnedIds.has(achievement.id)) continue;

    let earned = false;
    switch (achievement.requirement_type) {
      case "total_minutes":
        earned = (stats.totalMinutes ?? 0) >= achievement.requirement_value;
        break;
      case "streak_days":
        earned = (stats.streakDays ?? 0) >= achievement.requirement_value;
        break;
      case "quiz_perfect":
        earned = (stats.quizScore ?? 0) === 100;
        break;
      case "quiz_count":
        earned = (stats.quizCount ?? 0) >= achievement.requirement_value;
        break;
      case "friend_count":
        earned = (stats.friendCount ?? 0) >= achievement.requirement_value;
        break;
      case "todo_completed":
        earned = (stats.todoCompleted ?? 0) >= achievement.requirement_value;
        break;
      case "level":
        earned = (stats.level ?? 1) >= achievement.requirement_value;
        break;
      case "pomodoro_count":
        earned = true; // Any session counts
        break;
      case "night_session":
        earned = stats.nightSession ?? false;
        break;
    }

    if (earned) {
      await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
      });
      await awardXP(
        userId,
        achievement.xp_reward,
        `Achievement: ${achievement.name}`,
        "achievement",
        achievement.id
      );
      newlyEarned.push(achievement.id);
    }
  }

  return newlyEarned;
}
