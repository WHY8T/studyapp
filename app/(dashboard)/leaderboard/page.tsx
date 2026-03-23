"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/lib/utils";
import type { Profile } from "@/types";
import { getLevelInfo as getLevelInfoFn } from "@/types";
import { Trophy, Flame, Zap, Clock, Medal, Crown, Loader2 } from "lucide-react";

type LeaderboardType = "xp" | "streak" | "study_time";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<LeaderboardType>("xp");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const orderCol = type === "xp" ? "xp" : type === "streak" ? "streak_current" : "total_study_minutes";

      // Get friend IDs
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendIds = (friendships ?? []).map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      // Include self
      const ids = [...friendIds, user.id];

      const [{ data: board }, { data: prof }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .in("id", ids)
          .order(orderCol, { ascending: false })
          .limit(50),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);
      setLeaderboard((board as Profile[]) ?? []);
      setCurrentUser(prof as Profile);
      setLoading(false);
    });
  }, [type]);

  const myRank = leaderboard.findIndex((p) => p.id === currentUser?.id) + 1;

  const MEDALS = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compete with fellow students. Rise to the top!
        </p>
      </div>

      {/* Type selector */}
      <div className="flex bg-muted rounded-xl p-1 gap-1">
        {(["xp", "streak", "study_time"] as LeaderboardType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${type === t ? "bg-lime text-[#0D0D18]" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {t === "xp" ? "⚡ XP" : t === "streak" ? "🔥 Streak" : "⏱ Study Time"}
          </button>
        ))}
      </div>

      {/* Your rank */}
      {myRank > 0 && currentUser && (
        <Card className="border-lime/30 bg-lime/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="font-display font-black text-2xl text-lime">#{myRank}</div>
            <div className="w-10 h-10 rounded-full bg-lime flex items-center justify-center text-[#0D0D18] font-bold">
              {currentUser.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">You</p>
              <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-bold text-lime">
                {type === "xp"
                  ? `${currentUser.xp.toLocaleString()} XP`
                  : type === "streak"
                    ? `${currentUser.streak_current} days`
                    : formatMinutes(currentUser.total_study_minutes)}
              </p>
              <p className="text-xs text-muted-foreground">
                Level {getLevelInfoFn(currentUser.xp).level}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {leaderboard.map((player, index) => {
              const rank = index + 1;
              const isMe = player.id === currentUser?.id;
              const levelInfo = getLevelInfoFn(player.xp);
              const medal = MEDALS[index];

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors cursor-pointer ${isMe ? "bg-lime/5" : "hover:bg-muted/30"
                    }`}
                  onClick={() => !isMe && router.push(`/profile/${player.username}`)}
                >
                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {medal ? (
                      <span className="text-xl">{medal}</span>
                    ) : (
                      <span className="font-display font-bold text-muted-foreground text-sm">
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{
                      background: rank <= 3 ? ["#00b7ff", "#C0C0C0", "#CD7F32"][rank - 1] : "hsl(var(--muted))",
                      color: rank === 1 ? "#0D0D18" : rank <= 3 ? "#0D0D18" : "hsl(var(--foreground))",
                    }}
                  >
                    {player.username.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold truncate ${isMe ? "text-lime" : ""}`}>
                        {isMe ? "You" : player.username}
                      </p>
                      <div className="level-badge text-[10px] px-1.5 py-0.5">
                        Lv.{levelInfo.level}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">@{player.username}</p>
                  </div>

                  {/* Value */}
                  <div className="text-right shrink-0">
                    <p className={`font-display font-bold ${rank === 1 ? "text-lime" : ""}`}>
                      {type === "xp"
                        ? `${player.xp.toLocaleString()}`
                        : type === "streak"
                          ? `${player.streak_current}`
                          : formatMinutes(player.total_study_minutes)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {type === "xp" ? "XP" : type === "streak" ? "days" : "studied"}
                    </p>
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
