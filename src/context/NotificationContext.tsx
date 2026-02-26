import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type NotificationType = 'reply' | 'mention' | 'upvote' | 'milestone' | 'system';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
    actorName?: string;
    actorAvatar?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
    clearNotifications: () => void;
}

// ============================================================================
// Context
// ============================================================================

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}

// ============================================================================
// Sample Data
// ============================================================================

const sampleNotifications: Notification[] = [
    {
        id: 'n1',
        type: 'reply',
        title: 'New Reply',
        message: 'null_ptr replied to your thread "Best practices for async/await"',
        link: '/thread/t1',
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        actorName: 'null_ptr',
    },
    {
        id: 'n2',
        type: 'upvote',
        title: 'Post Upvoted',
        message: 'Your post received 10 upvotes! +100 Rep',
        link: '/thread/t2',
        read: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'n3',
        type: 'mention',
        title: 'You were mentioned',
        message: 'pixel_witch mentioned you in "CSS Dark Arts: Glassmorphism Guide"',
        link: '/thread/t3',
        read: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        actorName: 'pixel_witch',
    },
    {
        id: 'n4',
        type: 'milestone',
        title: 'Milestone Reached!',
        message: 'Congratulations! You reached 1,000 reputation points 🎉',
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'n5',
        type: 'system',
        title: 'Welcome to Clove',
        message: 'Welcome to the community! Check out our rules and start posting.',
        link: '/rules',
        read: true,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
];

// ============================================================================
// Provider
// ============================================================================

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const addNotification = useCallback(
        (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
            const newNotification: Notification = {
                ...notification,
                id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                read: false,
                createdAt: new Date().toISOString(),
            };
            setNotifications((prev) => [newNotification, ...prev]);
        },
        []
    );

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                markAsRead,
                markAllAsRead,
                addNotification,
                clearNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}
