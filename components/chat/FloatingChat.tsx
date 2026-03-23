"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/types";
import {
    MessageCircle, X, Send, ChevronLeft, Timer, Loader2,
    Check, CheckCheck, Mic, ImagePlus, Play, Pause, StopCircle,
} from "lucide-react";

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    type: "text" | "image" | "voice";
    media_url?: string;
    duration_seconds?: number;
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

// ─── Voice Player ─────────────────────────────────────────────────────────────
function VoicePlayer({ url, duration, isMine }: { url: string; duration?: number; isMine: boolean }) {
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [error, setError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.preload = "metadata";
        audio.src = url;
        audioRef.current = audio;
        audio.onended = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
        audio.ontimeupdate = () => {
            const d = audio.duration || duration || 1;
            setCurrentTime(audio.currentTime);
            setProgress((audio.currentTime / d) * 100);
        };
        audio.onerror = () => setError(true);
        return () => { audio.pause(); audio.src = ""; };
    }, [url]);

    const toggle = async () => {
        if (!audioRef.current || error) return;
        try {
            if (playing) { audioRef.current.pause(); setPlaying(false); }
            else { await audioRef.current.play(); setPlaying(true); }
        } catch { setError(true); }
    };

    const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

    if (error) return <p className="text-xs opacity-60">🎤 Voice message (unsupported)</p>;

    return (
        <div className="flex items-center gap-2 min-w-[160px]">
            <button onClick={toggle} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMine ? "bg-[#0D0D18]/20" : "bg-lime/20"}`}>
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
            </button>
            <div className="flex-1 space-y-1">
                <div className={`h-1.5 rounded-full overflow-hidden ${isMine ? "bg-[#0D0D18]/20" : "bg-muted"}`}>
                    <div className={`h-full rounded-full transition-all ${isMine ? "bg-[#0D0D18]/60" : "bg-lime"}`} style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[10px] opacity-60">{fmt(currentTime)} / {fmt(duration ?? 0)}</p>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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
    const [recording, setRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [uploadingVoice, setUploadingVoice] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
            setCurrentUser(prof as Profile);

            const { data: friendships } = await supabase.from("friendships")
                .select("requester_id, addressee_id").eq("status", "accepted")
                .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
            if (!friendships) return;

            const friendIds = friendships.map((f) => f.requester_id === user.id ? f.addressee_id : f.requester_id);
            if (friendIds.length === 0) return;

            const { data: profiles } = await supabase.from("profiles").select("*").in("id", friendIds);
            setFriends((profiles as Profile[]) ?? []);

            const { count } = await supabase.from("messages")
                .select("*", { count: "exact", head: true })
                .eq("receiver_id", user.id).eq("read", false);
            setUnreadCount(count ?? 0);
        };
        load();
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        const channel = supabase.channel(`chat:${currentUser.id}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${currentUser.id}` },
                (payload) => {
                    const msg = payload.new as Message;
                    if (selectedFriend?.id === msg.sender_id) {
                        setMessages((prev) => [...prev, msg]);
                        supabase.from("messages").update({ read: true }).eq("id", msg.id);
                    } else {
                        setUnreadCount((prev) => prev + 1);
                        playNotifSound();
                        const name = friends.find((f) => f.id === msg.sender_id)?.username ?? "Friend";
                        toast({ title: `💬 ${name}`, description: msg.type === "voice" ? "🎤 Voice message" : msg.type === "image" ? "🖼️ Image" : msg.content.slice(0, 60) });
                    }
                }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser, selectedFriend, friends]);

    useEffect(() => {
        if (!currentUser) return;
        const channel = supabase.channel(`study:${currentUser.id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "study_rooms", filter: `guest_id=eq.${currentUser.id}` },
                (payload) => {
                    const room = payload.new as StudyRoom;
                    if (room.status === "waiting") {
                        toast({ title: "📚 Study invite!", description: `${friends.find((f) => f.id === room.host_id)?.username} wants to study!` });
                        setStudyRoom(room); if (!open) setOpen(true);
                        const host = friends.find((f) => f.id === room.host_id);
                        if (host) setSelectedFriend(host);
                    } else if (room.status === "active") { setStudyRoom(room); startTimer(room); }
                    else { setStudyRoom(null); setTimeLeft(0); if (timerRef.current) clearInterval(timerRef.current); }
                }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser, friends, open]);

    useEffect(() => {
        if (!selectedFriend || !currentUser) return;
        const load = async () => {
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
            if (room) { setStudyRoom(room as StudyRoom); if (room.status === "active") startTimer(room as StudyRoom); }
        };
        load();
    }, [selectedFriend, currentUser]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
    useEffect(() => { if (selectedFriend && open) setTimeout(() => inputRef.current?.focus(), 100); }, [selectedFriend, open]);

    const playNotifSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 880; osc.type = "sine";
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
        } catch { /* ignore */ }
    };

    const startTimer = (room: StudyRoom) => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!room.ends_at) return;
        const tick = () => {
            const r = Math.max(0, Math.floor((new Date(room.ends_at!).getTime() - Date.now()) / 1000));
            setTimeLeft(r);
            if (r <= 0) { if (timerRef.current) clearInterval(timerRef.current); supabase.from("study_rooms").update({ status: "finished" }).eq("id", room.id); }
        };
        tick(); timerRef.current = setInterval(tick, 1000);
    };

    const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUser || !selectedFriend) return;
        const content = newMessage.trim(); setNewMessage("");
        setMessages((prev) => [...prev, { id: Math.random().toString(), sender_id: currentUser.id, receiver_id: selectedFriend.id, content, type: "text", read: false, created_at: new Date().toISOString() }]);
        await supabase.from("messages").insert({ sender_id: currentUser.id, receiver_id: selectedFriend.id, content, type: "text" });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser || !selectedFriend) return;
        if (!file.type.startsWith("image/")) { toast({ title: "Only images allowed", variant: "destructive" }); return; }
        if (file.size > 5 * 1024 * 1024) { toast({ title: "Max 5MB", variant: "destructive" }); return; }
        setUploadingImage(true);
        const ext = file.name.split(".").pop();
        const path = `${currentUser.id}/${Date.now()}.${ext}`;
        const { error: err } = await supabase.storage.from("chat-media").upload(path, file);
        if (err) { toast({ title: "Upload failed", variant: "destructive" }); setUploadingImage(false); return; }
        const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(path);
        await supabase.from("messages").insert({ sender_id: currentUser.id, receiver_id: selectedFriend.id, content: "", type: "image", media_url: publicUrl });
        setMessages((prev) => [...prev, { id: Math.random().toString(), sender_id: currentUser.id, receiver_id: selectedFriend.id, content: "", type: "image", media_url: publicUrl, read: false, created_at: new Date().toISOString() }]);
        setUploadingImage(false); e.target.value = "";
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
            const recorder = new MediaRecorder(stream, { mimeType });
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            recorder.start(100); mediaRecorderRef.current = recorder;
            setRecording(true); setRecordingSeconds(0);
            recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
        } catch { toast({ title: "Microphone access denied", variant: "destructive" }); }
    };

    const stopRecording = async () => {
        if (!mediaRecorderRef.current || !currentUser || !selectedFriend) return;
        setRecording(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        const duration = recordingSeconds;
        await new Promise<void>((resolve) => {
            mediaRecorderRef.current!.onstop = () => resolve();
            mediaRecorderRef.current!.stop();
            mediaRecorderRef.current!.stream.getTracks().forEach((t) => t.stop());
        });
        if (duration < 1) return;
        setUploadingVoice(true);
        const mimeType = audioChunksRef.current[0]?.type || "audio/webm";
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const path = `${currentUser.id}/voice_${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("chat-media").upload(path, blob);
        if (error) { toast({ title: "Upload failed", variant: "destructive" }); setUploadingVoice(false); return; }
        const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(path);
        await supabase.from("messages").insert({ sender_id: currentUser.id, receiver_id: selectedFriend.id, content: "", type: "voice", media_url: publicUrl, duration_seconds: duration });
        setMessages((prev) => [...prev, { id: Math.random().toString(), sender_id: currentUser.id, receiver_id: selectedFriend.id, content: "", type: "voice", media_url: publicUrl, duration_seconds: duration, read: false, created_at: new Date().toISOString() }]);
        setUploadingVoice(false); setRecordingSeconds(0);
    };

    const cancelRecording = () => {
        if (!mediaRecorderRef.current) return;
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
        setRecording(false); setRecordingSeconds(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        audioChunksRef.current = [];
    };

    const sendStudyInvite = async () => {
        if (!currentUser || !selectedFriend) return;
        setSendingStudyInvite(true);
        await supabase.from("study_rooms").delete()
            .or(`and(host_id.eq.${currentUser.id},guest_id.eq.${selectedFriend.id}),and(host_id.eq.${selectedFriend.id},guest_id.eq.${currentUser.id})`);
        const { data: room, error } = await supabase.from("study_rooms").insert({ host_id: currentUser.id, guest_id: selectedFriend.id, status: "waiting", duration_minutes: 25 }).select().single();
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

    const isGuest = studyRoom?.guest_id === currentUser?.id;
    const isHost = studyRoom?.host_id === currentUser?.id;

    return (
        <>
            {open && (
                <>
                    <div className="fixed z-50 bg-card flex flex-col inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[340px] sm:h-[560px] sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl overflow-hidden">
                        {selectedFriend ? (
                            <>
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm shrink-0">
                                    <button onClick={() => setSelectedFriend(null)} className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    {selectedFriend.avatar_url ? (
                                        <img src={selectedFriend.avatar_url} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-lime/20 flex items-center justify-center text-xs font-bold text-lime shrink-0">
                                            {selectedFriend.username.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{selectedFriend.username}</p>
                                        {selectedFriend.full_name && <p className="text-xs text-muted-foreground truncate">{selectedFriend.full_name}</p>}
                                    </div>
                                    <button onClick={sendStudyInvite} disabled={sendingStudyInvite || !!studyRoom} className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-lime transition-colors disabled:opacity-40">
                                        {sendingStudyInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Timer className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => setOpen(false)} className="hidden sm:flex p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {studyRoom && (
                                    <div className="px-4 py-2.5 bg-lime/10 border-b border-lime/20 shrink-0">
                                        {studyRoom.status === "waiting" && isGuest && (
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-lime">📚 Study invite!</p>
                                                <Button size="sm" className="h-6 text-xs px-3" onClick={acceptStudyInvite}>Accept</Button>
                                            </div>
                                        )}
                                        {studyRoom.status === "waiting" && isHost && <p className="text-xs text-muted-foreground text-center">Waiting for {selectedFriend.username}...</p>}
                                        {studyRoom.status === "active" && (
                                            <div className="flex items-center justify-center gap-2">
                                                <Timer className="w-3.5 h-3.5 text-lime" />
                                                <span className="font-mono font-bold text-lime text-sm">{fmt(timeLeft)}</span>
                                                <span className="text-xs text-muted-foreground">studying together</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                                    {loading ? (
                                        <div className="flex justify-center py-12"><Loader2 className="animate-spin w-5 h-5 text-muted-foreground" /></div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-lime/10 flex items-center justify-center"><MessageCircle className="w-7 h-7 text-lime" /></div>
                                            <p className="text-sm font-semibold">No messages yet</p>
                                            <p className="text-xs text-muted-foreground">Say hi to {selectedFriend.username}! 👋</p>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((msg, i) => {
                                                const isMine = msg.sender_id === currentUser?.id;
                                                const prev = messages[i - 1];
                                                const showTime = !prev || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;
                                                return (
                                                    <div key={msg.id}>
                                                        {showTime && (
                                                            <div className="flex justify-center my-2">
                                                                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                                            <div className={`relative max-w-[75%] px-3 py-2 text-sm leading-relaxed ${isMine ? "bg-lime text-[#0D0D18] rounded-2xl rounded-br-sm" : "bg-muted text-foreground rounded-2xl rounded-bl-sm"}`}>
                                                                {msg.type === "text" && <span>{msg.content}</span>}
                                                                {msg.type === "image" && msg.media_url && (
                                                                    <img src={msg.media_url} alt="Image" className="rounded-xl max-w-[220px] max-h-[200px] object-cover cursor-pointer" onClick={() => window.open(msg.media_url, "_blank")} />
                                                                )}
                                                                {msg.type === "voice" && msg.media_url && (
                                                                    <VoicePlayer url={msg.media_url} duration={msg.duration_seconds} isMine={isMine} />
                                                                )}
                                                                {isMine && msg.type === "text" && (
                                                                    <span className="inline-flex ml-1.5 opacity-60 translate-y-[1px]">
                                                                        {msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
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

                                <div className="p-3 border-t border-border bg-card/95 shrink-0">
                                    {recording ? (
                                        <div className="flex items-center gap-2 h-10">
                                            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                                                <span className="text-sm font-mono text-red-400">{fmt(recordingSeconds)}</span>
                                                <span className="text-xs text-muted-foreground">Recording...</span>
                                            </div>
                                            <button onClick={cancelRecording} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"><X className="w-4 h-4" /></button>
                                            <button onClick={stopRecording} disabled={uploadingVoice} className="p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors">
                                                {uploadingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                                            </button>
                                            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            <Input ref={inputRef} placeholder="Message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()} className="h-10 text-sm rounded-xl flex-1" />
                                            {newMessage.trim() ? (
                                                <Button size="sm" className="h-10 w-10 p-0 rounded-xl shrink-0" onClick={sendMessage}><Send className="w-4 h-4" /></Button>
                                            ) : (
                                                <button onClick={startRecording} className="w-10 h-10 rounded-xl bg-lime/10 border border-lime/30 flex items-center justify-center text-lime hover:bg-lime/20 transition-colors shrink-0">
                                                    <Mic className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 shrink-0">
                                    <p className="font-display font-bold text-base">Messages</p>
                                    <button onClick={() => setOpen(false)} className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto divide-y divide-border/50">
                                    {friends.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center"><MessageCircle className="w-8 h-8 text-muted-foreground/40" /></div>
                                            <p className="font-semibold text-muted-foreground">No friends yet</p>
                                            <p className="text-xs text-muted-foreground">Add friends to start chatting</p>
                                        </div>
                                    ) : (
                                        friends.map((friend) => (
                                            <button key={friend.id} onClick={() => setSelectedFriend(friend)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors">
                                                {friend.avatar_url ? (
                                                    <img src={friend.avatar_url} className="w-11 h-11 rounded-full object-cover shrink-0" alt="" />
                                                ) : (
                                                    <div className="w-11 h-11 rounded-full bg-lime/20 flex items-center justify-center font-bold text-lime text-sm shrink-0">
                                                        {friend.username.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="font-semibold text-sm">{friend.username}</p>
                                                    <p className="text-xs text-muted-foreground">Tap to chat</p>
                                                </div>
                                                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 shrink-0" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="fixed inset-0 z-40 sm:hidden" onClick={() => { if (!selectedFriend) setOpen(false); }} />
                </>
            )}
            <button onClick={() => setOpen((p) => !p)} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-lime flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform">
                {open ? <X className="w-6 h-6 text-[#0D0D18]" /> : <MessageCircle className="w-6 h-6 text-[#0D0D18]" />}
                {!open && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shadow-lg">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>
        </>
    );
}