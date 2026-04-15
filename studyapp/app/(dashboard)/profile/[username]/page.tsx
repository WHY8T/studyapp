"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getLevelInfo as getLevelInfoFn } from "@/types";
import { formatMinutes } from "@/lib/utils";
import type { Profile } from "@/types";
import {
    ArrowLeft,
    Flame,
    Clock,
    Zap,
    Trophy,
    UserPlus,
    UserCheck,
    Loader2,
    TrendingUp,
    CheckSquare,
    Target,
} from "lucide-react";

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const username = params.username as string;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [myUserId, setMyUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [friendStatus, setFriendStatus] = useState<"none" | "pending" | "friends">("none");
    const [friendshipId, setFriendshipId] = useState<string | null>(null);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [totalTodos, setTotalTodos] = useState(0);
    const [totalQuizzes, setTotalQuizzes] = useState(0);

    const supabase = createClient();

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setMyUserId(user.id);

            // Fetch the profile by username
            const { data: prof } = await supabase
                .from("profiles")
                .select("*")
                .eq("username", username)
                .single();

            if (!prof) {
                setLoading(false);
                return;
            }

            setProfile(prof as Profile);

            // Check friendship status
            const { data: friendship } = await supabase
                .from("friendships")
                .select("*")
                .or(
                    `and(requester_id.eq.${user.id},addressee_id.eq.${prof.id}),and(requester_id.eq.${prof.id},addressee_id.eq.${user.id})`
                )
                .maybeSingle();

            if (friendship) {
                setFriendshipId(friendship.id);
                setFriendStatus(friendship.status === "accepted" ? "friends" : "pending");
            }

            // Fetch achievements
            const { data: earned } = await supabase
                .from("user_achievements")
                .select("*, achievement:achievements(*)")
                .eq("user_id", prof.id)
                .order("earned_at", { ascending: false })
                .limit(6);

            setAchievements(earned ?? []);

            // Fetch stats
            const [{ data: todos }, { data: quizzes }] = await Promise.all([
                supabase.from("todos").select("id").eq("user_id", prof.id).eq("completed", true),
                supabase.from("quiz_attempts").select("id").eq("user_id", prof.id),
            ]);

            setTotalTodos(todos?.length ?? 0);
            setTotalQuizzes(quizzes?.length ?? 0);
            setLoading(false);
        };

        load();
    }, [username]);

    const handleAddFriend = async () => {
        if (!myUserId || !profile) return;
        const { error, data } = await supabase
            .from("friendships")
            .insert({ requester_id: myUserId, addressee_id: profile.id, status: "pending" })
            .select()
            .single();

        if (!error) {
            setFriendStatus("pending");
            setFriendshipId(data.id);
            toast({ title: "Friend request sent! 👋" });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">User not found.</p>
                <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Go back
                </Button>
            </div>
        );
    }

    const levelInfo = getLevelInfoFn(profile.xp);
    const isOwnProfile = myUserId === profile.id;

    const stats = [
        { label: "Total XP", value: profile.xp.toLocaleString(), icon: Zap, color: "text-lime" },
        { label: "Level", value: levelInfo.level, icon: TrendingUp, color: "text-blue-400" },
        { label: "Study Time", value: formatMinutes(profile.total_study_minutes), icon: Clock, color: "text-purple-400" },
        { label: "Best Streak", value: `${profile.streak_longest}d`, icon: Flame, color: "text-orange-400" },
        { label: "Tasks Done", value: totalTodos, icon: CheckSquare, color: "text-emerald-400" },
        { label: "Quizzes", value: totalQuizzes, icon: Target, color: "text-pink-400" },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Back button */}
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {/* Profile card */}
            <Card className="overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-[#0A0A14] via-[#1a1a30] to-[#0A0A14] relative">
                    <div className="absolute inset-0 bg-grid opacity-30" />
                    <div className="absolute -bottom-8 left-6">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.username}
                                className="w-20 h-20 rounded-2xl border-4 border-card object-cover"
                            />
                        ) : (
                            <div
                                className="w-20 h-20 rounded-2xl border-4 border-card flex items-center justify-center font-display font-black text-2xl"
                                style={{ background: "linear-gradient(135deg, #00b7ff, #0088cc)", color: "#0D0D18" }}
                            >
                                {profile.username.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                <CardContent className="pt-12 pb-6 px-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="font-display font-black text-xl">
                                {profile.full_name || profile.username}
                            </h1>
                            <p className="text-muted-foreground text-sm">@{profile.username}</p>
                            {profile.bio && (
                                <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
                            )}
                        </div>

                        {!isOwnProfile && (
                            <div>
                                {friendStatus === "friends" ? (
                                    <Button size="sm" variant="outline" disabled>
                                        <UserCheck className="w-4 h-4 mr-2" /> Friends
                                    </Button>
                                ) : friendStatus === "pending" ? (
                                    <Button size="sm" variant="outline" disabled>
                                        Requested
                                    </Button>
                                ) : (
                                    <Button size="sm" onClick={handleAddFriend}>
                                        <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                                    </Button>
                                )}
                            </div>
                        )}
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
                    <Card key={stat.label}>
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

            {/* Achievements */}
            {achievements.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-lime" />
                            Achievements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {achievements.map((ua) => (
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