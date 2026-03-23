"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, UserPlus, Trophy, Zap, Star, Users } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const NOTIF_ICONS: Record<Notification["type"], React.ReactNode> = {
    friend_request: <UserPlus className="w-4 h-4 text-blue-400" />,
    friend_accepted: <Users className="w-4 h-4 text-green-400" />,
    achievement: <Trophy className="w-4 h-4 text-yellow-400" />,
    challenge: <Zap className="w-4 h-4 text-purple-400" />,
    leaderboard: <Star className="w-4 h-4 text-orange-400" />,
};

const NOTIF_COLORS: Record<Notification["type"], string> = {
    friend_request: "bg-blue-500/10 border-blue-500/20",
    friend_accepted: "bg-green-500/10 border-green-500/20",
    achievement: "bg-yellow-500/10 border-yellow-500/20",
    challenge: "bg-purple-500/10 border-purple-500/20",
    leaderboard: "bg-orange-500/10 border-orange-500/20",
};

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const router = useRouter();

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node) &&
                !buttonRef.current?.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleNotifClick = async (notif: Notification) => {
        if (!notif.read) await markAsRead(notif.id);

        if (notif.type === "friend_request" || notif.type === "friend_accepted") {
            router.push("/friends");
            setOpen(false);
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                ref={buttonRef}
                onClick={() => setOpen((v) => !v)}
                className="relative p-2 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                aria-label="Notifications"
            >
                <Bell
                    className={`w-5 h-5 transition-all duration-200 ${unreadCount > 0
                            ? "text-[#00b7ff] drop-shadow-[0_0_8px_rgba(0,183,255,0.6)]"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                />

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/50 animate-bounce-once">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}

                {/* Ping ring when new */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 opacity-75 animate-ping" />
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div
                    ref={panelRef}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
                    style={{ animation: "slideDown 0.2s ease-out" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-[#00b7ff]" />
                            <span className="font-semibold text-sm text-foreground">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#00b7ff]/20 text-[#00b7ff] text-xs font-medium">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#00b7ff] transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col gap-2 p-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                                <Bell className="w-8 h-8 opacity-30" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="p-2 flex flex-col gap-1">
                                {notifications.map((notif) => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotifClick(notif)}
                                        className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] ${notif.read
                                                ? "border-transparent hover:bg-white/5"
                                                : `${NOTIF_COLORS[notif.type]} hover:brightness-110`
                                            }`}
                                    >
                                        {/* Avatar or icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {notif.from_profile?.avatar_url ? (
                                                <div className="relative">
                                                    <img
                                                        src={notif.from_profile.avatar_url}
                                                        alt={notif.from_profile.full_name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-card border border-white/10">
                                                        {NOTIF_ICONS[notif.type]}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                    {NOTIF_ICONS[notif.type]}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                            </p>
                                        </div>

                                        {/* Unread dot */}
                                        {!notif.read && (
                                            <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-[#00b7ff] shadow-[0_0_6px_rgba(0,183,255,0.8)]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-white/10 px-4 py-2.5">
                            <button
                                onClick={() => { router.push("/notifications"); setOpen(false); }}
                                className="w-full text-xs text-center text-[#00b7ff] hover:text-[#33c4ff] transition-colors font-medium"
                            >
                                View all notifications →
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.4s ease;
        }
      `}</style>
        </div>
    );
}