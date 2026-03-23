"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getLevelInfo as getLevelInfoFn } from "@/types";
import { formatMinutes } from "@/lib/utils";
import type { Profile, UserAchievement } from "@/types";
import {
  Edit3,
  Save,
  Trophy,
  Flame,
  Clock,
  Zap,
  BarChart2,
  CheckSquare,
  Target,
  TrendingUp,
  Loader2,
  Camera,
  Code2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { format, subDays } from "date-fns";

// ── Developer badge – shown on avatar corner for the app creator ──────────────
// Replace this with your own Supabase user ID to show the badge only on your profile
const DEVELOPER_ID = "2a9cccae-7e48-4db1-a696-2cbd44104fda";

function DevBadge() {
  return (
    <div
      title="App Developer"
      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full border-2 border-card flex items-center justify-center shadow-lg z-10"
      style={{ background: "linear-gradient(135deg, #00b7ff, #0055aa)" }}
    >
      <Code2 className="w-3.5 h-3.5 text-white" />
    </div>
  );
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", bio: "", username: "" });
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [xpHistory, setXpHistory] = useState<any[]>([]);
  const [studyChartData, setStudyChartData] = useState<any[]>([]);
  const [totalTodosCompleted, setTotalTodosCompleted] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const [
        { data: prof },
        { data: earned },
        { data: xpTxns },
        { data: todos },
        { data: quizAttempts },
        { data: sessions },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_achievements").select("*, achievement:achievements(*)").eq("user_id", user.id).order("earned_at", { ascending: false }),
        supabase.from("xp_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("todos").select("id").eq("user_id", user.id).eq("completed", true),
        supabase.from("quiz_attempts").select("id").eq("user_id", user.id),
        supabase.from("pomodoro_sessions").select("*").eq("user_id", user.id).eq("completed", true).gte("started_at", subDays(new Date(), 30).toISOString()),
      ]);

      setProfile(prof as Profile);
      setEditForm({ full_name: prof?.full_name ?? "", bio: prof?.bio ?? "", username: prof?.username ?? "" });
      setAchievements((earned as UserAchievement[]) ?? []);
      setTotalTodosCompleted(todos?.length ?? 0);
      setTotalQuizzes(quizAttempts?.length ?? 0);

      const xpByDay: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        xpByDay[d] = 0;
      }
      (xpTxns ?? []).forEach((tx) => {
        const d = format(new Date(tx.created_at), "yyyy-MM-dd");
        if (d in xpByDay) xpByDay[d] += tx.amount;
      });
      setXpHistory(Object.entries(xpByDay).map(([date, xp]) => ({ day: format(new Date(date), "EEE"), xp })));

      const studyByDay: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        studyByDay[d] = 0;
      }
      (sessions ?? []).forEach((s) => {
        const d = format(new Date(s.started_at), "yyyy-MM-dd");
        if (d in studyByDay) studyByDay[d] += s.duration_minutes;
      });
      setStudyChartData(
        Object.entries(studyByDay).slice(-14).map(([date, minutes]) => ({
          day: format(new Date(date), "MMM d"),
          minutes,
        }))
      );

      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!profile) return;

    if (editForm.username !== profile.username) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", editForm.username.toLowerCase())
        .maybeSingle();

      if (existing) {
        toast({ title: "Username taken", description: "Choose a different username.", variant: "destructive" });
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editForm.full_name, bio: editForm.bio, username: editForm.username.toLowerCase() })
      .eq("id", profile.id);

    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...editForm } : null);
      setEditing(false);
      toast({ title: "Profile updated!" });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be smaller than 5 MB", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${profile.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : null);
      toast({ title: "Profile photo updated! 📸" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const levelInfo = getLevelInfoFn(profile.xp);
  const isDeveloper = profile.id === DEVELOPER_ID;

  const stats = [
    { label: "Total XP", value: profile.xp.toLocaleString(), icon: Zap, color: "text-lime" },
    { label: "Current Level", value: levelInfo.level, icon: TrendingUp, color: "text-blue-400" },
    { label: "Study Time", value: formatMinutes(profile.total_study_minutes), icon: Clock, color: "text-purple-400" },
    { label: "Best Streak", value: `${profile.streak_longest} days`, icon: Flame, color: "text-orange-400" },
    { label: "Tasks Done", value: totalTodosCompleted, icon: CheckSquare, color: "text-emerald-400" },
    { label: "Quizzes Taken", value: totalQuizzes, icon: Target, color: "text-pink-400" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#0A0A14] via-[#1a1a30] to-[#0A0A14] relative">
          <div className="absolute inset-0 bg-grid opacity-30" />
          {/* Avatar with upload + dev badge */}
          <div className="absolute -bottom-8 left-6">
            <div className="relative group">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-24 h-24 rounded-2xl border-4 border-card object-cover"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-2xl border-4 border-card flex items-center justify-center font-display font-black text-3xl"
                  style={{ background: "linear-gradient(135deg, #00b7ff, #0088cc)", color: "#0D0D18" }}
                >
                  {profile.username.slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Developer badge on avatar corner */}
              {isDeveloper && <DevBadge />}

              {/* Camera overlay on hover */}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Change profile photo"
              >
                {uploadingAvatar
                  ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                  : <Camera className="w-6 h-6 text-white" />
                }
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>
        </div>

        <CardContent className="pt-12 pb-6 px-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {editing ? (
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder="Full name"
                    className="font-display font-bold text-xl h-auto py-1"
                  />
                ) : (
                  <h1 className="font-display font-black text-xl">
                    {profile.full_name || profile.username}
                  </h1>
                )}
                {/* Developer label next to name */}
                {isDeveloper && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border"
                    style={{ background: "rgba(0,183,255,0.1)", borderColor: "rgba(0,183,255,0.3)", color: "#00b7ff" }}>
                    <Code2 className="w-3 h-3" />
                    App Developer
                  </span>
                )}
              </div>
              {editing ? (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-muted-foreground text-sm">@</span>
                  <input
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                    className="text-sm bg-transparent border-b border-border focus:outline-none focus:border-lime w-32"
                    maxLength={20}
                    minLength={3}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">@{profile.username}</p>
              )}
              {editing ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Your bio..."
                  className="w-full rounded-xl border border-border bg-muted px-4 py-2 text-sm mt-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-lime/50"
                />
              ) : (
                profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
              )}
            </div>

            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4" />Save
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit3 className="w-4 h-4" />Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Level bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="level-badge">{levelInfo.level}</div>
                <span className="font-display font-semibold">Level {levelInfo.level}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {levelInfo.currentXp} / {levelInfo.xpForNextLevel} XP
              </span>
            </div>
            <Progress value={levelInfo.xpProgress} className="h-3" />
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: "Streak", value: profile.streak_current, suffix: "days", icon: "🔥" },
              { label: "Total XP", value: profile.xp.toLocaleString(), suffix: "pts", icon: "⚡" },
              { label: "Member since", value: new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }), suffix: "", icon: "📅" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-muted p-3 text-center">
                <span className="text-xl">{s.icon}</span>
                <p className="font-display font-bold mt-1">{s.value} {s.suffix}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="p-4">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className={`font-display font-black text-xl ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Study chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-lime" />
            Study Activity (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(v) => [`${v} min`, "Study time"]}
                />
                <Bar dataKey="minutes" fill="#00b7ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* XP chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-lime" />
            XP Earned This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={xpHistory}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00b7ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00b7ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(v) => [`+${v} XP`, "Earned"]}
                />
                <Area type="monotone" dataKey="xp" stroke="#00b7ff" strokeWidth={2} fill="url(#xpGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-lime" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {achievements.slice(0, 6).map((ua) => (
                <div key={ua.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-xl bg-lime/20 flex items-center justify-center text-xl shrink-0">
                    🏆
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{ua.achievement?.name}</p>
                    <p className="text-xs text-muted-foreground">{ua.achievement?.description}</p>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <p className="text-xs font-bold text-lime">+{ua.achievement?.xp_reward} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}