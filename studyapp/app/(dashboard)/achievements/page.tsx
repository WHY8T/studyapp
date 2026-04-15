"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageContext";
import { RARITY_CONFIG } from "@/types";
import type { Achievement, UserAchievement, Profile } from "@/types";
import { Trophy, Lock, Zap, Check, Loader2 } from "lucide-react";
import * as Icons from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap: Icons.Zap, Clock: Icons.Clock, Sun: Icons.Sun, Calendar: Icons.Calendar,
  Flame: Icons.Flame, Trophy: Icons.Trophy, Star: Icons.Star, Brain: Icons.Brain,
  Users: Icons.Users, UserPlus: Icons.UserPlus, CheckSquare: Icons.CheckSquare,
  TrendingUp: Icons.TrendingUp, Crown: Icons.Crown, Moon: Icons.Moon,
};

export default function AchievementsPage() {
  const { t, language } = useLanguage();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<UserAchievement[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data: all }, { data: userEarned }, { data: prof }] = await Promise.all([
        supabase.from("achievements").select("*").order("rarity"),
        supabase.from("user_achievements").select("*, achievement:achievements(*)").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);
      setAchievements((all as Achievement[]) ?? []);
      setEarned((userEarned as UserAchievement[]) ?? []);
      setProfile(prof as Profile);
      setLoading(false);
    });
  }, []);

  const earnedIds = new Set(earned.map((e) => e.achievement_id));
  const totalXpFromBadges = earned.reduce((sum, e) => sum + (e.achievement?.xp_reward ?? 0), 0);

  // Category labels per language
  const CATEGORY_LABELS: Record<string, Record<string, string>> = {
    en: { all: "all", study: "study", streak: "streak", quiz: "quiz", social: "social", special: "special" },
    ar: { all: "الكل", study: "دراسة", streak: "سلسلة", quiz: "اختبار", social: "اجتماعي", special: "مميز" },
    fr: { all: "tout", study: "étude", streak: "série", quiz: "quiz", social: "social", special: "spécial" },
  };

  const RARITY_LABELS: Record<string, Record<string, string>> = {
    en: { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" },
    ar: { common: "عادي", rare: "نادر", epic: "ملحمي", legendary: "أسطوري" },
    fr: { common: "Commun", rare: "Rare", epic: "Épique", legendary: "Légendaire" },
  };

  const catLabels = CATEGORY_LABELS[language] ?? CATEGORY_LABELS.en;
  const rarityLabels = RARITY_LABELS[language] ?? RARITY_LABELS.en;

  const categories = ["all", "study", "streak", "quiz", "social", "special"];
  const filteredAchievements = achievements.filter((a) => filter === "all" || a.category === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl">{t("nav_achievements")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {earnedIds.size}/{achievements.length}{" "}
            {language === "ar" ? "مفتوح" : language === "fr" ? "débloqués" : "unlocked"}{" "}
            •{" "}
            <span className="text-lime font-medium">+{totalXpFromBadges} XP {language === "ar" ? "من الشارات" : language === "fr" ? "de badges" : "from badges"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-lime" />
          <span className="font-display font-bold text-xl">{earnedIds.size}</span>
          <span className="text-muted-foreground text-sm">/ {achievements.length}</span>
        </div>
      </div>

      {/* Overall progress */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-lime via-lime-400 to-lime-600" />
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">
              {language === "ar" ? "تقدم الإنجازات" : language === "fr" ? "Progression des succès" : "Achievement Progress"}
            </p>
            <p className="text-sm font-bold text-lime">
              {Math.round((earnedIds.size / achievements.length) * 100)}%
            </p>
          </div>
          <Progress value={(earnedIds.size / achievements.length) * 100} className="h-3" />
          <div className="grid grid-cols-4 gap-3 mt-4">
            {(["common", "rare", "epic", "legendary"] as const).map((rarity) => {
              const total = achievements.filter((a) => a.rarity === rarity).length;
              const userEarned = earned.filter((e) => e.achievement?.rarity === rarity).length;
              const config = RARITY_CONFIG[rarity];
              return (
                <div key={rarity} className={`rounded-xl p-3 text-center ${config.bg}`}>
                  <p className={`font-display font-bold text-lg ${config.color}`}>{userEarned}/{total}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{rarityLabels[rarity]}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all",
              filter === cat ? "bg-lime text-[#0D0D18]" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}>
            {catLabels[cat]}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const isEarned = earnedIds.has(achievement.id);
          const rarityConfig = RARITY_CONFIG[achievement.rarity];
          const IconComp = ICON_MAP[achievement.icon] ?? Trophy;

          return (
            <div key={achievement.id}
              className={cn(
                "relative rounded-2xl border p-5 transition-all duration-300",
                isEarned
                  ? `${rarityConfig.bg} border-current/20 shadow-lg ${rarityConfig.glow ? `shadow-[${rarityConfig.glow}]` : ""}`
                  : "border-border bg-card opacity-50 grayscale"
              )}>
              {/* Rarity badge */}
              <div className="absolute top-3 right-3">
                <span className={`text-xs font-bold capitalize ${rarityConfig.color}`}>
                  {rarityLabels[achievement.rarity]}
                </span>
              </div>

              {/* Icon */}
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", isEarned ? "bg-white/10" : "bg-muted")}>
                {isEarned
                  ? <IconComp className={`w-6 h-6 ${rarityConfig.color}`} />
                  : <Lock className="w-6 h-6 text-muted-foreground" />}
              </div>

              <h3 className={`font-display font-bold ${isEarned ? "text-foreground" : "text-muted-foreground"}`}>
                {achievement.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{achievement.description}</p>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-lime" />
                  <span className="text-xs font-bold text-lime">+{achievement.xp_reward} XP</span>
                </div>
                {isEarned ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">
                      {language === "ar" ? "مكتسب" : language === "fr" ? "Gagné" : "Earned"}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {language === "ar" ? "مقفل" : language === "fr" ? "Verrouillé" : "Locked"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}