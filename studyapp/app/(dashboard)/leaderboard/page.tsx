"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/providers/LanguageContext";
import { formatMinutes } from "@/lib/utils";
import type { Profile } from "@/types";
import { getLevelInfo as getLevelInfoFn } from "@/types";
import { Loader2, Trophy } from "lucide-react";

type LeaderboardType = "xp" | "streak" | "study_time";

function Avatar({ profile, rank }: { profile: Profile; rank: number }) {
  const ring = rank === 1 ? "hsl(var(--primary))" : "hsl(var(--border))";
  if (profile.avatar_url) return <img src={profile.avatar_url} alt={profile.username} className="w-10 h-10 rounded-full object-cover shrink-0 border" style={{ borderColor: ring }} />;
  return <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 border bg-muted text-muted-foreground" style={{ borderColor: ring }}>{profile.username.slice(0, 2).toUpperCase()}</div>;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<LeaderboardType>("xp");
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const orderCol = type === "xp" ? "xp" : type === "streak" ? "streak_current" : "total_study_minutes";
      const { data: friendships } = await supabase.from("friendships").select("requester_id, addressee_id").eq("status", "accepted").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      const friendIds = (friendships ?? []).map((f) => f.requester_id === user.id ? f.addressee_id : f.requester_id);
      const ids = [...friendIds, user.id];
      const [{ data: board }, { data: prof }] = await Promise.all([
        supabase.from("profiles").select("*").in("id", ids).order(orderCol, { ascending: false }).limit(50),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);
      setLeaderboard((board as Profile[]) ?? []);
      setCurrentUser(prof as Profile);
      setLoading(false);
    });
  }, [type]);

  const myRank = leaderboard.findIndex((p) => p.id === currentUser?.id) + 1;
  const MEDAL_CLASSES = ["text-warning", "text-muted-foreground", "text-warning/60"]; // gold, silver, bronze

  const getValue = (p: Profile) => type === "xp" ? p.xp.toLocaleString() : type === "streak" ? p.streak_current : formatMinutes(p.total_study_minutes);
  const getUnit = () => type === "xp" ? "XP" : type === "streak" ? t("lb_days") : t("lb_studied");

  const displayName = (p: Profile, isMe: boolean) => {
    if (isMe) return t("lb_you");
    if (p.username.includes("@")) return p.username.split("@")[0];
    return p.username;
  };
  const displayHandle = (p: Profile) => p.username.includes("@") ? `@${p.username.split("@")[0]}` : `@${p.username}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight" dir={isRTL ? "rtl" : "ltr"}>{t("lb_title")}</h1>
        <p className="text-muted-foreground text-sm mt-1" dir={isRTL ? "rtl" : "ltr"}>{t("lb_subtitle")}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["xp", "streak", "study_time"] as LeaderboardType[]).map((tp) => (
          <button key={tp} onClick={() => setType(tp)} className={`rounded-md border py-2 px-3 text-xs sm:text-sm font-semibold transition-colors ${type === tp ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
            {tp === "xp" ? t("lb_xp") : tp === "streak" ? t("lb_streak") : t("lb_study_time")}
          </button>
        ))}
      </div>

      {myRank > 0 && currentUser && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-muted-foreground shrink-0">#{myRank}</div>
              <Avatar profile={currentUser} rank={myRank} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{t("lb_you")}</p>
                <p className="text-xs text-muted-foreground truncate">{displayHandle(currentUser)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-muted-foreground text-sm sm:text-base">{getValue(currentUser)}</p>
                <p className="text-xs text-muted-foreground">{getUnit()}</p>
                <p className="text-xs text-muted-foreground">{t("lb_level")} {getLevelInfoFn(currentUser.xp).level}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin w-6 h-6 text-muted-foreground" /></div>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {leaderboard.map((player, index) => {
              const rank = index + 1;
              const isMe = player.id === currentUser?.id;
              const levelInfo = getLevelInfoFn(player.xp);
              const medalClass = MEDAL_CLASSES[index];
              return (
                <div key={player.id} className={`flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer ${isMe ? "bg-muted/30" : "hover:bg-muted/50"}`} onClick={() => !isMe && router.push(`/profile/${player.username}`)}>
                  <div className="w-7 flex items-center justify-center shrink-0">{medalClass ? <Trophy className={`w-4 h-4 ${medalClass}`} /> : <span className="font-display font-semibold text-muted-foreground text-xs">#{rank}</span>}</div>
                  <Avatar profile={player} rank={rank} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`font-semibold text-sm truncate ${isMe ? "text-muted-foreground" : ""}`}>{displayName(player, isMe)}</p>
                      <Badge variant="secondary" className="shrink-0">Lv.{levelInfo.level}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{displayHandle(player)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`font-display font-semibold text-sm ${rank === 1 ? "text-muted-foreground" : ""}`}>{getValue(player)}</p>
                    <p className="text-xs text-muted-foreground">{getUnit()}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}