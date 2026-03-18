export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ============================================================
// DATABASE TYPES
// ============================================================

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  xp: number;
  total_study_minutes: number;
  streak_current: number;
  streak_longest: number;
  streak_last_study: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  total_minutes: number;
  created_at: string;
}

export interface PomodoroSession {
  id: string;
  user_id: string;
  subject_id: string | null;
  duration_minutes: number;
  break_minutes: number;
  completed: boolean;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  subject?: Subject;
}

export type TodoPriority = "low" | "medium" | "high" | "urgent";

export interface Todo {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  completed: boolean;
  priority: TodoPriority;
  due_date: string | null;
  completed_at: string | null;
  xp_reward: number;
  created_at: string;
  updated_at: string;
  subject?: Subject;
}

export type StudyEventType = "study" | "exam" | "assignment" | "reminder";

export interface StudyEvent {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  event_type: StudyEventType;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  created_at: string;
  subject?: Subject;
}

export interface Quiz {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  pdf_url: string | null;
  pdf_filename: string | null;
  question_count: number;
  created_at: string;
  subject?: Subject;
}

export interface QuizOption {
  text: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: QuizOption[];
  explanation: string | null;
  order_index: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  answers: Record<string, number>;
  time_taken_seconds: number | null;
  xp_earned: number;
  completed_at: string;
}

export type AchievementCategory = "study" | "streak" | "social" | "quiz" | "special";
export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  xp_reward: number;
  rarity: AchievementRarity;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  addressee?: Profile;
}

export interface XpTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  source_type: string | null;
  source_id: string | null;
  created_at: string;
}

// ============================================================
// APP-SPECIFIC TYPES
// ============================================================

export interface DashboardStats {
  todayMinutes: number;
  weekMinutes: number;
  completedTodosToday: number;
  pendingTodos: number;
  pomodorosTodayCount: number;
  xpEarnedToday: number;
}

export interface WeeklyStats {
  day: string;
  minutes: number;
  pomodoros: number;
  todos: number;
}

export type PomodoroPhase = "work" | "break" | "longBreak";

export interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreak: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
}

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  xpProgress: number; // 0-100 percentage
}

// XP required per level (exponential growth)
export const XP_PER_LEVEL = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));

export const getLevelInfo = (totalXp: number): LevelInfo => {
  let level = 1;
  let xpAccumulated = 0;
  while (xpAccumulated + XP_PER_LEVEL(level) <= totalXp) {
    xpAccumulated += XP_PER_LEVEL(level);
    level++;
  }
  const currentXp = totalXp - xpAccumulated;
  const xpForNextLevel = XP_PER_LEVEL(level);
  return {
    level,
    currentXp,
    xpForNextLevel,
    xpProgress: Math.round((currentXp / xpForNextLevel) * 100),
  };
};

export const PRIORITY_CONFIG: Record<
  TodoPriority,
  { label: string; color: string; bgColor: string }
> = {
  low: { label: "Low", color: "text-blue-400", bgColor: "bg-blue-400/10" },
  medium: { label: "Medium", color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
  high: { label: "High", color: "text-orange-400", bgColor: "bg-orange-400/10" },
  urgent: { label: "Urgent", color: "text-red-400", bgColor: "bg-red-400/10" },
};

export const RARITY_CONFIG: Record<
  AchievementRarity,
  { label: string; color: string; bg: string; glow: string }
> = {
  common: {
    label: "Common",
    color: "text-zinc-400",
    bg: "bg-zinc-800",
    glow: "",
  },
  rare: {
    label: "Rare",
    color: "text-blue-400",
    bg: "bg-blue-950",
    glow: "shadow-blue-500/20",
  },
  epic: {
    label: "Epic",
    color: "text-purple-400",
    bg: "bg-purple-950",
    glow: "shadow-purple-500/20",
  },
  legendary: {
    label: "Legendary",
    color: "text-lime",
    bg: "bg-lime-950",
    glow: "shadow-lime-400/30",
  },
};
