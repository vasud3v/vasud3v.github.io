import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Check,
    CheckCheck,
    MessageCircle,
    AtSign,
    ThumbsUp,
    Trophy,
    Settings,
    Trash2,
    X,
} from 'lucide-react';
import { useNotifications, NotificationType } from '@/context/NotificationContext';

const notificationIcons: Record<NotificationType, typeof MessageCircle> = {
    reply: MessageCircle,
    mention: AtSign,
    upvote: ThumbsUp,
    milestone: Trophy,
    system: Settings,
};

const notificationColors: Record<NotificationType, string> = {
    reply: 'text-cyan-400',
    mention: 'text-forum-pink',
    upvote: 'text-emerald-400',
    milestone: 'text-amber-400',
    system: 'text-forum-muted',
};

export default function NotificationCenter() {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } =
        useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="transition-forum relative rounded-md p-2 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-forum-pink to-pink-600 text-[9px] font-bold text-white animate-dot-pulse shadow-lg shadow-forum-pink/60 border border-forum-pink/40 ring-2 ring-forum-pink/20">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 hud-panel overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-forum-border px-4 py-3">
                        <h4 className="text-[12px] font-semibold text-forum-text font-mono flex items-center gap-2">
                            <Bell size={13} className="text-forum-pink" />
                            Notifications
                            {unreadCount > 0 && (
                                <span className="text-[9px] font-mono text-forum-pink bg-forum-pink/10 border border-forum-pink/20 rounded-full px-2 py-0.5">
                                    {unreadCount} new
                                </span>
                            )}
                        </h4>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="transition-forum rounded p-1 text-forum-muted hover:text-emerald-400 hover:bg-emerald-500/10"
                                    title="Mark all as read"
                                >
                                    <CheckCheck size={13} />
                                </button>
                            )}
                            <button
                                onClick={clearNotifications}
                                className="transition-forum rounded p-1 text-forum-muted hover:text-red-400 hover:bg-red-500/10"
                                title="Clear all"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications list */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((notif) => {
                                const Icon = notificationIcons[notif.type];
                                const color = notificationColors[notif.type];
                                return (
                                    <button
                                        key={notif.id}
                                        className={`transition-forum flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-forum-hover border-b border-forum-border/10 ${!notif.read ? 'bg-forum-pink/[0.02]' : ''
                                            }`}
                                        onClick={() => {
                                            markAsRead(notif.id);
                                            if (notif.link) {
                                                navigate(notif.link);
                                                setIsOpen(false);
                                            }
                                        }}
                                    >
                                        <div className={`mt-0.5 flex-shrink-0 ${color}`}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-mono font-semibold text-forum-text">
                                                    {notif.title}
                                                </span>
                                                {!notif.read && (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-forum-pink animate-dot-pulse flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-forum-muted leading-relaxed font-mono line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <span className="text-[8px] font-mono text-forum-muted/60 mt-1 block">
                                                {formatTimeAgo(notif.createdAt)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Bell size={28} className="text-forum-muted/20 mb-2" />
                                <span className="text-[11px] font-mono text-forum-muted">
                                    No notifications
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
