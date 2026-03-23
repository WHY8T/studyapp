"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/types";
import {
    MessageCircle, X, Send, ChevronLeft,
    Timer, Loader2, Check, CheckCheck,
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
    const inputRef = useRef<HTMLInputElement>(null);

    // Load current user and friends
    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
            setCurrentUser(prof as Profile);

            const { data: friendships } = await supabase
                .from("friendships").select("requester_id, addressee_id")
                .eq("status", "accepted")
                .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

            if (!friendships) return;
            const friendIds = friendships.map((f) =>
                f.requester_id === user.id ? f.addressee_id : f.requester_id
            );
            if (friendIds.length === 0) return;

            const { data: friendProfiles } = await supabase.from("profiles").select("*").in("id", friendIds);
            setFriends((friendProfiles as Profile[]) ?? []);

            const { count } = await supabase.from("messages")
                .select("*", { count: "exact", head: true })
                .eq("receiver_id", user.id).eq("read", false);
            setUnreadCount(count ?? 0);
        };
        load();
    }, []);

    // Subscribe to messages
    useEffect(() => {
        if (!currentUser) return;
        const channel = supabase.channel("messages")
            .on("postgres_changes", {
                event: "INSERT", schema: "public", table: "messages",
                filter: `receiver_id=eq.${currentUser.id}`,
            }, (payload) => {
                const msg = payload.new as Message;
                if (selectedFriend?.id === msg.sender_id) {
                    setMessages((prev) => [...prev, msg]);
                    supabase.from("messages").update({ read: true }).eq("id", msg.id);
                } else {
                    setUnreadCount((prev) => prev + 1);
                    toast({
                        title: `💬 ${friends.find((f) => f.id === msg.sender_id)?.username ?? "Friend"}`,
                        description: msg.content.slice(0, 60),
                    });
                }
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser, selectedFriend, friends]);

    // Subscribe to study rooms
    useEffect(() => {
        if (!currentUser) return;
        const channel = supabase.channel("study_rooms")
            .on("postgres_changes", {
                event: "*", schema: "public", table: "study_rooms",
                filter: `guest_id=eq.${currentUser.id}`,
            }, (payload) => {
                const room = payload.new as StudyRoom;
                if (room.status === "waiting") {
                    toast({ title: "📚 Study invite!", description: `${friends.find((f) => f.id === room.host_id)?.username} wants to study together!` });
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
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser, friends, open]);

    // Load messages when friend selected
    useEffect(() => {
        if (!selectedFriend || !currentUser) return;
        const loadMessages = async () => {
            setLoading(true);
            const { data } = await supabase.from("messages").select("*")
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${currentUser.id})`)
                .order("created_at", { ascending: true }).limit(50);
            setMessages((data as Message[]) ?? []);
            setLoading(false);

            await supabase.from("messages").update({ read: true })
                .eq("sender_id", selectedFriend.id).eq("receiver_id", currentUser.id).eq("read", false);
            setUnreadCount((prev) => Math.max(0, prev - 1));

            const { data: room } = await supabase.from("study_rooms").select("*")
                .or(`and(host_id.eq.${currentUser.id},guest_id.eq.${selectedFriend.id}),and(host_id.eq.${selectedFriend.id},guest_id.eq.${currentUser.id})`)
                .neq("status", "finished").maybeSingle();
            if (room) {
                setStudyRoom(room as StudyRoom);
                if (room.status === "active") startTimer(room as StudyRoom);
            }
        };
        loadMessages();
    }, [selectedFriend, currentUser]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (selectedFriend && open) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [selectedFriend, open]);

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
            content, read: false,
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
        await supabase.from("study_rooms").delete()
            .or(`and(host_id.eq.${currentUser.id},guest_id.eq.${selectedFriend.id}),and(host_id.eq.${selectedFriend.id},guest_id.eq.${currentUser.id})`);
        const { data: room, error } = await supabase.from("study_rooms").insert({
            host_id: currentUser.id, guest_id: selectedFriend.id, status: "waiting", duration_minutes: 25,
        }).select().single();
        if (!error) { setStudyRoom(room as StudyRoom); toast({ title: "Study invite sent! ⏱" }); }
        setSendingStudyInvite(false);
    };

    const acceptStudyInvite = async () => {
        if (!studyRoom) return;
        const endsAt = new Date(Date.now() + studyRoom.duration_minutes * 60 * 1000).toISOString();
        const { data: updated } = await supabase.from("study_rooms")
            .update({ status: "active", started_at: new Date().toISOString(), ends_at: endsAt })
            .eq("id", studyRoom.id).select().single();
        if (updated) { setStudyRoom(updated as StudyRoom); startTimer(updated as StudyRoom); }
    };

    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const isGuest = studyRoom?.guest_id === currentUser?.id;
    const isHost = studyRoom?.host_id === currentUser?.id;

    // ── RENDER ──────────────────────────────────────────────────
    return (
        <>
            {/* ── CHAT PANEL ── */}
            {open && (
                <>
                    {/* Mobile: fullscreen overlay */}
                    <div className={`
            fixed z-50 bg-card flex flex-col
            /* Mobile: full screen */
            inset-0
            /* Desktop: floating panel bottom-right */
            sm:inset-auto sm:bottom-24 sm:right-6
            sm:w-80 sm:h-[520px] sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl
            overflow-hidden
          `}>

                        {selectedFriend ? (
                            <>
                                {/* ── Chat header ── */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm shrink-0">
                                    <button
                                        onClick={() => setSelectedFriend(null)}
                                        className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    {/* Avatar */}
                                    {selectedFriend.avatar_url ? (
                                        <img src={selectedFriend.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-lime/20 flex items-center justify-center text-xs font-bold text-lime shrink-0">
                                            {selectedFriend.username.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{selectedFriend.username}</p>
                                        {selectedFriend.full_name && (
                                            <p className="text-xs text-muted-foreground truncate">{selectedFriend.full_name}</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={sendStudyInvite}
                                        disabled={sendingStudyInvite || !!studyRoom}
                                        className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-lime transition-colors disabled:opacity-40"
                                        title="Invite to study together"
                                    >
                                        {sendingStudyInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Timer className="w-4 h-4" />}
                                    </button>

                                    {/* Only show X on desktop — on mobile use back arrow */}
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="hidden sm:flex p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Study room banner */}
                                {studyRoom && (
                                    <div className="px-4 py-2.5 bg-lime/10 border-b border-lime/20 shrink-0">
                                        {studyRoom.status === "waiting" && isGuest && (
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-lime">📚 Study invite!</p>
                                                <Button size="sm" className="h-6 text-xs px-3" onClick={acceptStudyInvite}>Accept</Button>
                                            </div>
                                        )}
                                        {studyRoom.status === "waiting" && isHost && (
                                            <p className="text-xs text-muted-foreground text-center">Waiting for {selectedFriend.username}...</p>
                                        )}
                                        {studyRoom.status === "active" && (
                                            <div className="flex items-center justify-center gap-2">
                                                <Timer className="w-3.5 h-3.5 text-lime" />
                                                <span className="font-mono font-bold text-lime text-sm">{formatTime(timeLeft)}</span>
                                                <span className="text-xs text-muted-foreground">studying together</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Messages area */}
                                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                                    {loading ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="animate-spin w-5 h-5 text-muted-foreground" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-lime/10 flex items-center justify-center">
                                                <MessageCircle className="w-7 h-7 text-lime" />
                                            </div>
                                            <p className="text-sm font-semibold">No messages yet</p>
                                            <p className="text-xs text-muted-foreground">Say hi to {selectedFriend.username}! 👋</p>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((msg, i) => {
                                                const isMine = msg.sender_id === currentUser?.id;
                                                const prevMsg = messages[i - 1];
                                                const showTime = !prevMsg ||
                                                    new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000;

                                                return (
                                                    <div key={msg.id}>
                                                        {/* Time separator */}
                                                        {showTime && (
                                                            <div className="flex justify-center my-2">
                                                                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                                            <div className={`
                                relative max-w-[75%] px-3 py-2 text-sm leading-relaxed
                                ${isMine
                                                                    ? "bg-lime text-[#0D0D18] rounded-2xl rounded-br-sm"
                                                                    : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
                                                                }
                              `}>
                                                                {msg.content}
                                                                {/* Read tick for own messages */}
                                                                {isMine && (
                                                                    <span className="inline-flex ml-1.5 opacity-70 translate-y-[1px]">
                                                                        {msg.read
                                                                            ? <CheckCheck className="w-3 h-3" />
                                                                            : <Check className="w-3 h-3" />
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Input bar */}
                                <div className="p-3 border-t border-border bg-card/95 shrink-0 flex gap-2 items-center">
                                    <Input
                                        ref={inputRef}
                                        placeholder="Message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                                        className="h-10 text-sm rounded-xl"
                                    />
                                    <Button
                                        size="sm"
                                        className="h-10 w-10 p-0 rounded-xl shrink-0"
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* ── Friends list ── */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 shrink-0">
                                    <p className="font-display font-bold text-base">Messages</p>
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto divide-y divide-border/50">
                                    {friends.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
                                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                                                <MessageCircle className="w-8 h-8 text-muted-foreground/40" />
                                            </div>
                                            <p className="font-semibold text-muted-foreground">No friends yet</p>
                                            <p className="text-xs text-muted-foreground">Add friends to start chatting</p>
                                        </div>
                                    ) : (
                                        friends.map((friend) => (
                                            <button
                                                key={friend.id}
                                                onClick={() => setSelectedFriend(friend)}
                                                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors active:bg-muted"
                                            >
                                                {friend.avatar_url ? (
                                                    <img src={friend.avatar_url} className="w-11 h-11 rounded-full object-cover shrink-0" alt="" />
                                                ) : (
                                                    <div className="w-11 h-11 rounded-full bg-lime/20 flex items-center justify-center font-bold text-lime text-sm shrink-0">
                                                        {friend.username.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="font-semibold text-sm">{friend.username}</p>
                                                    <p className="text-xs text-muted-foreground truncate">Tap to chat</p>
                                                </div>
                                                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 shrink-0" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile: tap outside to close (backdrop) */}
                    <div
                        className="fixed inset-0 z-40 sm:hidden"
                        onClick={() => { if (!selectedFriend) setOpen(false); }}
                    />
                </>
            )}

            {/* ── Floating button ── */}
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-lime flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
            >
                {open
                    ? <X className="w-6 h-6 text-[#0D0D18]" />
                    : <MessageCircle className="w-6 h-6 text-[#0D0D18]" />
                }
                {!open && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shadow-lg">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>
        </>
    );
}