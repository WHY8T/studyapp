"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/types";
import {
    MessageCircle,
    X,
    Send,
    ChevronLeft,
    Timer,
    Loader2,
} from "lucide-react";

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    read: boolean;
    created_at: string;
}

interface StudyRoom {
    id: string;
    host_id: string;
    guest_id: string;
    status: "waiting" | "active" | "finished";
    duration_minutes: number;
    started_at: string | null;
    ends_at: string | null;
}

export default function FloatingChat() {
    const { toast } = useToast();
    const supabase = createClient();

    const [open, setOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [friends, setFriends] = useState<Profile[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [studyRoom, setStudyRoom] = useState<StudyRoom | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [sendingStudyInvite, setSendingStudyInvite] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Load current user and friends
    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: prof } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            setCurrentUser(prof as Profile);

            const { data: friendships } = await supabase
                .from("friendships")
                .select("requester_id, addressee_id")
                .eq("status", "accepted")
                .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

            if (!friendships) return;

            const friendIds = friendships.map((f) =>
                f.requester_id === user.id ? f.addressee_id : f.requester_id
            );

            if (friendIds.length === 0) return;

            const { data: friendProfiles } = await supabase
                .from("profiles")
                .select("*")
                .in("id", friendIds);

            setFriends((friendProfiles as Profile[]) ?? []);

            // Count unread messages
            const { count } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("receiver_id", user.id)
                .eq("read", false);

            setUnreadCount(count ?? 0);
        };

        load();
    }, []);

    // Subscribe to new messages
    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase
            .channel("messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `receiver_id=eq.${currentUser.id}`,
                },
                (payload) => {
                    const msg = payload.new as Message;
                    if (selectedFriend?.id === msg.sender_id) {
                        setMessages((prev) => [...prev, msg]);
                        // Mark as read immediately
                        supabase.from("messages").update({ read: true }).eq("id", msg.id);
                    } else {
                        setUnreadCount((prev) => prev + 1);
                        toast({
                            title: `New message from ${friends.find((f) => f.id === msg.sender_id)?.username ?? "friend"}`,
                            description: msg.content.slice(0, 50),
                        });
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentUser, selectedFriend, friends]);

    // Subscribe to study room changes
    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase
            .channel("study_rooms")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "study_rooms",
                    filter: `guest_id=eq.${currentUser.id}`,
                },
                (payload) => {
                    const room = payload.new as StudyRoom;
                    if (room.status === "waiting") {
                        toast({
                            title: "📚 Study invite!",
                            description: `${friends.find((f) => f.id === room.host_id)?.username} wants to study together!`,
                        });
                        setStudyRoom(room);
                        if (!open) setOpen(true);
                        const host = friends.find((f) => f.id === room.host_id);
                        if (host) setSelectedFriend(host);
                    } else if (room.status === "active") {
                        setStudyRoom(room);
                        startTimer(room);
                    } else if (room.status === "finished") {
                        setStudyRoom(null);
                        setTimeLeft(0);
                        if (timerRef.current) clearInterval(timerRef.current);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentUser, friends, open]);

    // Load messages when friend selected
    useEffect(() => {
        if (!selectedFriend || !currentUser) return;

        const loadMessages = async () => {
            setLoading(true);
            const { data } = await supabase
                .from("messages")
                .select("*")
                .or(
                    `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${currentUser.id})`
                )
                .order("created_at", { ascending: true })
                .limit(50);

            setMessages((data as Message[]) ?? []);
            setLoading(false);

            // Mark messages as read
            await supabase
                .from("messages")
                .update({ read: true })
                .eq("sender_id", selectedFriend.id)
                .eq("receiver_id", currentUser.id)
                .eq("read", false);

            setUnreadCount((prev) => Math.max(0, prev - 1));

            // Check for active study room
            const { data: room } = await supabase
                .from("study_rooms")
                .select("*")
                .or(
                    `and(host_id.eq.${currentUser.id},guest_id.eq.${selectedFriend.id}),and(host_id.eq.${selectedFriend.id},guest_id.eq.${currentUser.id})`
                )
                .neq("status", "finished")
                .maybeSingle();

            if (room) {
                setStudyRoom(room as StudyRoom);
                if (room.status === "active") startTimer(room as StudyRoom);
            }
        };

        loadMessages();
    }, [selectedFriend, currentUser]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const startTimer = (room: StudyRoom) => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!room.ends_at) return;

        const tick = () => {
            const remaining = Math.max(0, Math.floor((new Date(room.ends_at!).getTime() - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) {
                if (timerRef.current) clearInterval(timerRef.current);
                supabase.from("study_rooms").update({ status: "finished" }).eq("id", room.id);
            }
        };

        tick();
        timerRef.current = setInterval(tick, 1000);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUser || !selectedFriend) return;
        const content = newMessage.trim();
        setNewMessage("");

        const optimistic: Message = {
            id: Math.random().toString(),
            sender_id: currentUser.id,
            receiver_id: selectedFriend.id,
            content,
            read: false,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);

        await supabase.from("messages").insert({
            sender_id: currentUser.id,
            receiver_id: selectedFriend.id,
            content,
        });
    };

    const sendStudyInvite = async () => {
        if (!currentUser || !selectedFriend) return;
        setSendingStudyInvite(true);

        // Delete any old room between these two
        await supabase
            .from("study_rooms")
            .delete()
            .or(
                `and(host_id.eq.${currentUser.id},guest_id.eq.${selectedFriend.id}),and(host_id.eq.${selectedFriend.id},guest_id.eq.${currentUser.id})`
            );

        const { data: room, error } = await supabase
            .from("study_rooms")
            .insert({
                host_id: currentUser.id,
                guest_id: selectedFriend.id,
                status: "waiting",
                duration_minutes: 25,
            })
            .select()
            .single();

        if (!error) {
            setStudyRoom(room as StudyRoom);
            toast({ title: "Study invite sent! ⏱" });
        }
        setSendingStudyInvite(false);
    };

    const acceptStudyInvite = async () => {
        if (!studyRoom) return;
        const endsAt = new Date(Date.now() + studyRoom.duration_minutes * 60 * 1000).toISOString();

        const { data: updated } = await supabase
            .from("study_rooms")
            .update({
                status: "active",
                started_at: new Date().toISOString(),
                ends_at: endsAt,
            })
            .eq("id", studyRoom.id)
            .select()
            .single();

        if (updated) {
            setStudyRoom(updated as StudyRoom);
            startTimer(updated as StudyRoom);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const isHost = studyRoom?.host_id === currentUser?.id;
    const isGuest = studyRoom?.guest_id === currentUser?.id;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Chat window */}
            {open && (
                <div className="w-80 h-[480px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    {selectedFriend ? (
                        <>
                            {/* Chat header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                                <button onClick={() => setSelectedFriend(null)} className="text-muted-foreground hover:text-foreground">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {selectedFriend.avatar_url ? (
                                    <img src={selectedFriend.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-lime/20 flex items-center justify-center text-xs font-bold text-lime">
                                        {selectedFriend.username.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{selectedFriend.username}</p>
                                </div>
                                <button
                                    onClick={sendStudyInvite}
                                    disabled={sendingStudyInvite || !!studyRoom}
                                    className="text-muted-foreground hover:text-lime transition-colors disabled:opacity-40"
                                    title="Invite to study together"
                                >
                                    {sendingStudyInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Timer className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Study room banner */}
                            {studyRoom && (
                                <div className="px-4 py-2 bg-lime/10 border-b border-lime/20 text-center">
                                    {studyRoom.status === "waiting" && isGuest && (
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-semibold text-lime">Study invite! 📚</p>
                                            <Button size="sm" className="h-6 text-xs px-3" onClick={acceptStudyInvite}>
                                                Accept
                                            </Button>
                                        </div>
                                    )}
                                    {studyRoom.status === "waiting" && isHost && (
                                        <p className="text-xs text-muted-foreground">Waiting for {selectedFriend.username} to accept...</p>
                                    )}
                                    {studyRoom.status === "active" && (
                                        <div className="flex items-center justify-center gap-2">
                                            <Timer className="w-3 h-3 text-lime" />
                                            <p className="text-sm font-display font-bold text-lime">{formatTime(timeLeft)}</p>
                                            <p className="text-xs text-muted-foreground">studying together</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="animate-spin w-5 h-5 text-muted-foreground" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-muted-foreground">No messages yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">Say hi! 👋</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMine = msg.sender_id === currentUser?.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                                <div
                                                    className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${isMine
                                                            ? "bg-lime text-[#0D0D18] rounded-br-sm"
                                                            : "bg-muted text-foreground rounded-bl-sm"
                                                        }`}
                                                >
                                                    {msg.content}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-border flex gap-2">
                                <Input
                                    placeholder="Message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                    className="h-9 text-sm"
                                />
                                <Button size="sm" className="h-9 w-9 p-0" onClick={sendMessage} disabled={!newMessage.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Friends list */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                <p className="font-display font-bold">Messages</p>
                                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {friends.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-sm text-muted-foreground">No friends yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">Add friends to start chatting</p>
                                    </div>
                                ) : (
                                    friends.map((friend) => (
                                        <button
                                            key={friend.id}
                                            onClick={() => setSelectedFriend(friend)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                                        >
                                            {friend.avatar_url ? (
                                                <img src={friend.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center font-bold text-lime text-sm">
                                                    {friend.username.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="text-left">
                                                <p className="font-semibold text-sm">{friend.username}</p>
                                                <p className="text-xs text-muted-foreground">Tap to chat</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Floating button */}
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="w-14 h-14 rounded-full bg-lime flex items-center justify-center shadow-lg hover:scale-105 transition-transform relative"
            >
                <MessageCircle className="w-6 h-6 text-[#0D0D18]" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
}