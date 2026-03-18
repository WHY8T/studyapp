"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatMinutes } from "@/lib/utils";
import { getLevelInfo as getLevelInfoFn } from "@/types";
import type { Profile, Friendship } from "@/types";
import {
  Search,
  UserPlus,
  Check,
  X,
  Users,
  Loader2,
  Trophy,
  Flame,
  Clock,
  Zap,
} from "lucide-react";

interface FriendWithProfile {
  friendship: Friendship;
  profile: Profile;
}

export default function FriendsPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendWithProfile[]>([]);
  const [pendingSent, setPendingSent] = useState<FriendWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const supabase = createClient();

  const fetchFriends = async (uid: string) => {
    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);

    if (!friendships) return;

    const accepted: FriendWithProfile[] = [];
    const received: FriendWithProfile[] = [];
    const sent: FriendWithProfile[] = [];

    for (const f of friendships) {
      const otherUserId = f.requester_id === uid ? f.addressee_id : f.requester_id;
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", otherUserId)
        .single();

      if (!prof) continue;

      const item = { friendship: f as Friendship, profile: prof as Profile };

      if (f.status === "accepted") accepted.push(item);
      else if (f.status === "pending" && f.addressee_id === uid) received.push(item);
      else if (f.status === "pending" && f.requester_id === uid) sent.push(item);
    }

    setFriends(accepted);
    setPendingReceived(received);
    setPendingSent(sent);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setMyProfile(prof as Profile);
      await fetchFriends(user.id);
      setLoading(false);
    });
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !userId) return;
    setSearching(true);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", userId)
      .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      .limit(10);

    setSearchResults((data as Profile[]) ?? []);
    setSearching(false);
  };

  const sendRequest = async (targetId: string) => {
    if (!userId) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: userId,
      addressee_id: targetId,
      status: "pending",
    });

    if (!error) {
      toast({ title: "Friend request sent! 👋" });
      setSearchResults((prev) => prev.filter((p) => p.id !== targetId));
      await fetchFriends(userId);
    }
  };

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    if (!userId) return;
    await supabase
      .from("friendships")
      .update({ status: accept ? "accepted" : "blocked" })
      .eq("id", friendshipId);

    if (accept) toast({ title: "Friend added! 🎉", description: "You can now see each other's progress" });
    await fetchFriends(userId);
  };

  const removeFriend = async (friendshipId: string) => {
    if (!userId) return;
    await supabase.from("friendships").delete().eq("id", friendshipId);
    await fetchFriends(userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl">Friends</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {friends.length} friends • Study together, grow together
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="font-bold">{friends.length}</span>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <p className="font-display font-semibold">Find Students</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((p) => {
                const alreadyFriend = friends.some((f) => f.profile.id === p.id);
                const requestSent = pendingSent.some((f) => f.profile.id === p.id);
                const levelInfo = getLevelInfoFn(p.xp);

                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border"
                  >
                    <div className="w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center font-bold text-lime">
                      {p.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{p.username}</p>
                        <div className="level-badge text-[10px]">Lv.{levelInfo.level}</div>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.xp.toLocaleString()} XP</p>
                    </div>
                    {alreadyFriend ? (
                      <Badge variant="muted">Friends</Badge>
                    ) : requestSent ? (
                      <Badge variant="muted">Requested</Badge>
                    ) : (
                      <Button size="sm" onClick={() => sendRequest(p.id)}>
                        <UserPlus className="w-3 h-3" />
                        Add
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending requests */}
      {pendingReceived.length > 0 && (
        <Card className="border-lime/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-lime flex items-center justify-center text-xs font-bold text-[#0D0D18]">
                {pendingReceived.length}
              </span>
              Friend Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingReceived.map(({ friendship, profile: p }) => (
              <div key={friendship.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center font-bold text-lime">
                  {p.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{p.username}</p>
                  <p className="text-xs text-muted-foreground">{p.xp.toLocaleString()} XP</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => respondToRequest(friendship.id, false)}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                  <Button size="sm" onClick={() => respondToRequest(friendship.id, true)}>
                    <Check className="w-4 h-4" />
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Friends list */}
      <div>
        <h2 className="font-display font-bold text-lg mb-4">Your Friends</h2>
        {friends.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-muted-foreground">No friends yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Search for students above to add them
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {friends.map(({ friendship, profile: p }) => {
              const levelInfo = getLevelInfoFn(p.xp);
              return (
                <Card key={friendship.id} className="card-hover">
                  <CardContent className="p-5 space-y-4">
                    {/* Profile header */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime to-lime-600 flex items-center justify-center font-bold text-[#0D0D18] text-lg">
                        {p.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-display font-bold truncate">{p.username}</p>
                          <div className="level-badge text-[10px]">Lv.{levelInfo.level}</div>
                        </div>
                        {p.full_name && (
                          <p className="text-xs text-muted-foreground">{p.full_name}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeFriend(friendship.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: Zap, label: "XP", value: p.xp.toLocaleString(), color: "text-lime" },
                        { icon: Flame, label: "Streak", value: `${p.streak_current}d`, color: "text-orange-400" },
                        { icon: Clock, label: "Studied", value: formatMinutes(p.total_study_minutes), color: "text-blue-400" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-muted p-2 text-center">
                          <stat.icon className={`w-3 h-3 mx-auto mb-1 ${stat.color}`} />
                          <p className={`font-bold text-xs ${stat.color}`}>{stat.value}</p>
                          <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* XP bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Level {levelInfo.level}</span>
                        <span>{levelInfo.xpProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-lime transition-all"
                          style={{ width: `${levelInfo.xpProgress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
