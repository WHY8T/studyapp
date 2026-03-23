"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatMinutes } from "@/lib/utils";
import type { Profile } from "@/types";
import { getLevelInfo as getLevelInfoFn } from "@/types";
import { Loader2 } from "lucide-react";

type LeaderboardType = "xp" | "streak" | "study_time";

// ── Avatar component — shows photo if available, else initials ────────────────
function Avatar({ profile, size = 10, rank }: { profile: Profile; size?: number; rank: number }) {
  const colors =
    rank === 1 ? "#00b7ff" :
      rank === 2 ? "#C0C0C0" :
        rank === 3 ? "#CD7F32" : undefined;

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.username}
        className={`w-${size} h-${size} rounded-full object-cover shrink-0 border-2`}
        style={{ borderColor: colors ?? "hsl(var(--border))" }}
      />
    );
  }

  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center font-bold text-sm shrink-0`}
      style={{
        background: colors ?? "hsl(var(--muted))",
        color: rank <= 3 ? "#0D0D18" : "hsl(var(--foreground))",
      }}
    >
      {profile.username.slice(0, 2).toUpperCase()}
    </div>
  );
}

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

      const orderCol =
        type === "xp" ? "xp" :
          type === "streak" ? "streak_current" :
            "total_study_minutes";

      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendIds = (friendships ?? []).map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

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

  const getValue = (p: Profile) =>
    type === "xp" ? p.xp.toLocaleString() :
      type === "streak" ? p.streak_current :
        formatMinutes(p.total_study_minutes);

  const getUnit = () =>
    type === "xp" ? "XP" :
      type === "streak" ? "days" :
        "studied";

  // Clean display name — never show email
  const displayName = (p: Profile, isMe: boolean) => {
    if (isMe) return "You";
    // if username looks like an email, show the part before @
    if (p.username.includes("@")) return p.username.split("@")[0];
    return p.username;
  };

  const displayHandle = (p: Profile) => {
    if (p.username.includes("@")) return `@${p.username.split("@")[0]}`;
    return `@${p.username}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-2 sm:px-0">
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
            className={`flex-1 py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all ${type === t ? "bg-lime text-[#0D0D18]" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {t === "xp" ? "⚡ XP" : t === "streak" ? "🔥 Streak" : "⏱ Study Time"}
          </button>
        ))}
      </div>

      {/* Your rank card — fully responsive */}
      {myRank > 0 && currentUser && (
        <Card className="border-lime/30 bg-lime/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="font-display font-black text-xl sm:text-2xl text-lime shrink-0">
                #{myRank}
              </div>
              <Avatar profile={currentUser} size={10} rank={myRank} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">You</p>
                <p className="text-xs text-muted-foreground truncate">
                  {displayHandle(currentUser)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-lime text-sm sm:text-base">
                  {getValue(currentUser)}
                </p>
                <p className="text-xs text-muted-foreground">{getUnit()}</p>
                <p className="text-xs text-muted-foreground">
                  Level {getLevelInfoFn(currentUser.xp).level}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard list */}
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
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer ${isMe ? "bg-lime/5" : "hover:bg-muted/30"
                    }`}
                  onClick={() => !isMe && router.push(`/profile/${player.username}`)}
                >
                  {/* Rank / medal */}
                  <div className="w-7 text-center shrink-0">
                    {medal ? (
                      <span className="text-lg">{medal}</span>
                    ) : (
                      <span className="font-display font-bold text-muted-foreground text-xs">
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar profile={player} size={10} rank={rank} />

                  {/* Name + handle */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`font-semibold text-sm truncate ${isMe ? "text-lime" : ""}`}>
                        {displayName(player, isMe)}
                      </p>
                      <span className="level-badge text-[10px] px-1.5 py-0.5 shrink-0">
                        Lv.{levelInfo.level}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {displayHandle(player)}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0 ml-2">
                    <p className={`font-display font-bold text-sm ${rank === 1 ? "text-lime" : ""}`}>
                      {getValue(player)}
                    </p>
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