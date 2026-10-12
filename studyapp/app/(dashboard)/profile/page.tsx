"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getLevelInfo as getLevelInfoFn } from "@/types";
import type { Profile, UserAchievement } from "@/types";
import {
  Edit3, Save, Trophy, Zap, TrendingUp, Loader2, Camera,
  Code2, ExternalLink, FileText, BookOpen, FlaskConical,
  Presentation, GraduationCap, Eye, ChevronDown, ChevronUp, Flame, Calendar
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

const DEVELOPER_ID = "2a9cccae-7e48-4db1-a696-2cbd44104fda";

function DevBadge() {
  return (
    <div
      title="App Developer"
      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full border-2 border-card bg-primary flex items-center justify-center z-10"
    >
      <Code2 className="w-3.5 h-3.5 text-primary-foreground" />
    </div>
  );
}

interface ShowcaseItem {
  id: string; user_id: string; title: string; description: string | null;
  type: string; subject: string | null; file_url: string | null;
  external_url: string | null; is_public: boolean; created_at: string;
}

const TYPE_CONFIG: Record<string, { labelKey: string; icon: React.ElementType }> = {
  paper: { labelKey: "paper", icon: FileText },
  project: { labelKey: "project", icon: BookOpen },
  research: { labelKey: "research", icon: FlaskConical },
  presentation: { labelKey: "presentation", icon: Presentation },
  other: { labelKey: "other", icon: GraduationCap },
};

function PdfViewer({ url, title, t }: { url: string; title: string; t: (k: any) => string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition"
      >
        <Eye className="w-3.5 h-3.5" />
        {expanded ? t("showcase_hide_pdf") : t("showcase_view_pdf")}
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="mt-2 rounded-md overflow-hidden border border-border">
          <iframe src={`${url}#toolbar=0&navpanes=0`} title={title} className="w-full"
            style={{ height: "420px", background: "hsl(var(--muted))" }} />
          <div className="flex justify-end px-3 py-2 bg-muted border-t border-border">
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline">
              <ExternalLink className="w-3 h-3" /> {t("showcase_open_tab")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", bio: "", username: "" });
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [xpHistory, setXpHistory] = useState<any[]>([]);
  const [showcase, setShowcase] = useState<ShowcaseItem[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data: prof }, { data: earned }, { data: xpTxns }, { data: showcaseData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_achievements").select("*, achievement:achievements(*)")
          .eq("user_id", user.id).order("earned_at", { ascending: false }),
        supabase.from("xp_transactions").select("*").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(20),
        supabase.from("work_showcases").select("*").eq("user_id", user.id)
          .eq("is_public", true).order("created_at", { ascending: false }),
      ]);

      setProfile(prof as Profile);
      setEditForm({ full_name: prof?.full_name ?? "", bio: prof?.bio ?? "", username: prof?.username ?? "" });
      setAchievements((earned as UserAchievement[]) ?? []);
      setShowcase((showcaseData as ShowcaseItem[]) ?? []);

      const xpByDay: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        xpByDay[d] = 0;
      }
      (xpTxns ?? []).forEach((tx) => {
        const d = format(new Date(tx.created_at), "yyyy-MM-dd");
        if (d in xpByDay) xpByDay[d] += tx.amount;
      });
      setXpHistory(Object.entries(xpByDay).map(([date, xp]) => ({
        day: format(new Date(date), "EEE"), xp,
      })));
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    if (editForm.username !== profile.username) {
      const { data: existing } = await supabase.from("profiles").select("id")
        .eq("username", editForm.username.toLowerCase()).maybeSingle();
      if (existing) {
        toast({ title: "Username taken", description: "Choose a different username.", variant: "destructive" });
        return;
      }
    }
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name,
      bio: editForm.bio,
      username: editForm.username.toLowerCase(),
    }).eq("id", profile.id);
    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...editForm } : null));
      setEditing(false);
      toast({ title: "Profile updated!" });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be smaller than 5 MB", variant: "destructive" }); return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${profile.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from("profiles")
        .update({ avatar_url: avatarUrl }).eq("id", profile.id);
      if (updateError) throw updateError;
      setProfile((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : null));
      toast({ title: "Profile photo updated! " });
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Profile header card ─────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-card border-b border-border relative">
          <div className="absolute -bottom-8 left-6">
            <div className="relative group">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username}
                  className="w-24 h-24 rounded-full border-4 border-card object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-card bg-primary text-primary-foreground flex items-center justify-center font-display font-semibold text-3xl"
                >
                  {profile.username.slice(0, 2).toUpperCase()}
                </div>
              )}
              {isDeveloper && <DevBadge />}
              <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar
                  ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                  : <Camera className="w-6 h-6 text-white" />}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
          </div>
        </div>

        <CardContent className="pt-12 pb-6 px-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {editing ? (
                  <Input value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder={t("profile_full_name_ph")}
                    className="font-display font-semibold text-xl h-auto py-1" />
                ) : (
                  <h1 className="font-display font-semibold text-xl">{profile.full_name || profile.username}</h1>
                )}
                {isDeveloper && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-primary/30 bg-primary/10 text-primary">
                    <Code2 className="w-3 h-3" /> {t("profile_app_dev")}
                  </span>
                )}
              </div>

              {editing ? (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-muted-foreground text-sm">@</span>
                  <input value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                    className="text-sm bg-transparent border-b border-border focus:outline-none focus:border-primary w-32"
                    maxLength={20} minLength={3} />
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">@{profile.username}</p>
              )}

              {editing ? (
                <textarea value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder={t("profile_bio_ph")}
                  className="w-full rounded-md border border-border bg-muted px-4 py-2 text-sm mt-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/50" />
              ) : (
                profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
              )}
            </div>

            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>{t("profile_cancel")}</Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4" /> {t("profile_save")}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit3 className="w-4 h-4" /> {t("profile_edit")}
                </Button>
              )}
            </div>
          </div>

          {/* Level bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Lv.{levelInfo.level}</Badge>
                <span className="font-semibold text-sm text-muted-foreground">{t("profile_level")} {levelInfo.level}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {levelInfo.currentXp} / {levelInfo.xpForNextLevel} XP
              </span>
            </div>
            <Progress value={levelInfo.xpProgress} className="h-1.5" />
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: t("profile_streak"), value: profile.streak_current, suffix: t("profile_days"), icon: <Flame className="w-4 h-4 text-primary" /> },
              { label: t("profile_total_xp"), value: profile.xp.toLocaleString(), suffix: t("profile_pts"), icon: <Zap className="w-4 h-4 text-primary" /> },
              {
                label: t("profile_member_since"),
                value: new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
                suffix: "", icon: <Calendar className="w-4 h-4 text-primary" />,
              },
            ].map((s) => (
              <div key={s.label} className="rounded-md bg-muted p-3 text-center">
                <div className="w-7 h-7 flex items-center justify-center mx-auto mb-1">{s.icon}</div>
                <p className="font-semibold mt-1">{s.value} {s.suffix}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: t("profile_total_xp"), value: profile.xp.toLocaleString(), icon: Zap, color: "text-primary" },
          { label: t("profile_current_level"), value: levelInfo.level, icon: TrendingUp, color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className={`font-semibold text-xl ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── XP chart ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> {t("profile_xp_week")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={xpHistory}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(v) => [`+${v} XP`, t("profile_earned")]} />
                <Area type="monotone" dataKey="xp" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#xpGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Showcase ──────────────────────────────────────────────────── */}
      {showcase.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> {t("profile_showcase")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {showcase.map((item) => {
                const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.other;
                const Icon = config.icon;
                return (
                  <div key={item.id}
                    className="rounded-md border border-border bg-muted/30 p-4 space-y-2 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                        {item.subject && <p className="text-xs text-muted-foreground">{item.subject}</p>}
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 pl-12">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 pl-12 flex-wrap">
                      <Badge variant="secondary" className="text-[11px]">
                        {config.labelKey}
                      </Badge>
                      {item.external_url && (
                        <a href={item.external_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" /> {t("showcase_view_link")}
                        </a>
                      )}
                    </div>
                    {item.file_url && (
                      <div className="pl-12">
                        <PdfViewer url={item.file_url} title={item.title} t={t} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recent achievements ────────────────────────────────────────── */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" /> {t("profile_achievements")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {achievements.slice(0, 6).map((ua) => (
                <div key={ua.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xl shrink-0">

                  </div>
                  <div>
                    <p className="font-semibold text-sm">{ua.achievement?.name}</p>
                    <p className="text-xs text-muted-foreground">{ua.achievement?.description}</p>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <p className="text-xs font-semibold text-primary">+{ua.achievement?.xp_reward} XP</p>
                    <p className="text-[10px] text-muted-foreground">{t("profile_earned")}</p>
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