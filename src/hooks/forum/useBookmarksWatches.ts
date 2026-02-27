import { useState, useEffect, useCallback } from 'react';
import { User, Category } from '@/types/forum';
import { supabase, ForumError, handleSupabaseError } from '@/lib/supabase';

interface UseBookmarksWatchesParams {
    currentUser: User;
    isAuthenticated: boolean;
    authUserId: string | undefined;
    setCategoriesState: React.Dispatch<React.SetStateAction<Category[]>>;
    setError: (key: string, error: ForumError, operation: string) => void;
}

export function useBookmarksWatches({
    currentUser,
    isAuthenticated,
    authUserId,
    setCategoriesState,
    setError,
}: UseBookmarksWatchesParams) {
    const [bookmarkedThreads, setBookmarkedThreads] = useState<Set<string>>(new Set());
    const [watchedThreads, setWatchedThreads] = useState<Set<string>>(new Set());
    const [threadReadTimestamps, setThreadReadTimestamps] = useState<Map<string, string>>(new Map());

    // Load bookmarks
    useEffect(() => {
        if (!isAuthenticated || !authUserId) {
            setBookmarkedThreads(new Set());
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('thread_bookmarks')
                    .select('thread_id')
                    .eq('user_id', authUserId);
                if (!cancelled && data && !error) {
                    setBookmarkedThreads(new Set(data.map(row => row.thread_id)));
                }
            } catch (err) {
                console.warn('Failed to fetch bookmarks:', err);
            }
        })();
        return () => { cancelled = true; };
    }, [isAuthenticated, authUserId]);

    // Load watched threads
    useEffect(() => {
        if (!isAuthenticated || !authUserId) {
            setWatchedThreads(new Set());
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('thread_watches')
                    .select('thread_id')
                    .eq('user_id', authUserId);
                if (!cancelled && data && !error) {
                    setWatchedThreads(new Set(data.map(row => row.thread_id)));
                }
            } catch (err) {
                console.warn('Failed to fetch watched threads:', err);
            }
        })();
        return () => { cancelled = true; };
    }, [isAuthenticated, authUserId]);

    const toggleBookmark = useCallback(async (threadId: string) => {
        if (!authUserId) {
            throw new Error('You must be logged in to bookmark threads');
        }

        if (!isAuthenticated) {
            throw new Error('You must be logged in to bookmark threads');
        }

        // Verify user exists in forum_users table
        const { data: userCheck, error: userCheckError } = await supabase
            .from('forum_users')
            .select('id')
            .eq('id', authUserId)
            .maybeSingle();
        
        if (userCheckError) {
            throw new Error('Failed to verify user account');
        }
        
        if (!userCheck) {
            throw new Error('Your forum profile is not set up. Please contact an administrator.');
        }

        const wasBookmarked = bookmarkedThreads.has(threadId);
        
        // Optimistic update
        setBookmarkedThreads((prev) => {
            const next = new Set(prev);
            wasBookmarked ? next.delete(threadId) : next.add(threadId);
            return next;
        });

        try {
            if (wasBookmarked) {
                const { error } = await supabase.from('thread_bookmarks').delete()
                    .eq('thread_id', threadId)
                    .eq('user_id', authUserId);
                
                if (error) throw error;
            } else {
                const { error } = await supabase.from('thread_bookmarks').insert({
                    thread_id: threadId,
                    user_id: authUserId,
                });
                
                if (error) throw error;
            }
        } catch (error: any) {
            // Rollback optimistic update
            setBookmarkedThreads((prev) => {
                const next = new Set(prev);
                wasBookmarked ? next.add(threadId) : next.delete(threadId);
                return next;
            });
            
            const forumError = handleSupabaseError(error, 'toggleBookmark');
            setError(`bookmark-${threadId}`, forumError, 'toggleBookmark');
            
            // Provide user-friendly error message
            if (error.code === '23503') {
                throw new Error('Your forum profile is not set up correctly. Please contact an administrator.');
            } else if (error.code === '42501') {
                throw new Error('You do not have permission to bookmark threads.');
            } else {
                throw new Error(error.message || 'Failed to bookmark thread');
            }
        }
    }, [authUserId, currentUser, bookmarkedThreads, isAuthenticated, setError]);

    const isBookmarked = useCallback((threadId: string) => bookmarkedThreads.has(threadId), [bookmarkedThreads]);

    const toggleWatch = useCallback(async (threadId: string) => {
        if (!currentUser?.id) return;

        const wasWatching = watchedThreads.has(threadId);
        setWatchedThreads((prev) => {
            const next = new Set(prev);
            wasWatching ? next.delete(threadId) : next.add(threadId);
            return next;
        });

        try {
            if (wasWatching) {
                const { error } = await supabase.from('thread_watches').delete()
                    .eq('thread_id', threadId).eq('user_id', currentUser.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('thread_watches').insert({
                    thread_id: threadId, user_id: currentUser.id,
                });
                if (error) throw error;
            }
        } catch (error) {
            setWatchedThreads((prev) => {
                const next = new Set(prev);
                wasWatching ? next.add(threadId) : next.delete(threadId);
                return next;
            });
            const forumError = handleSupabaseError(error, 'toggleWatch');
            setError(`watch-${threadId}`, forumError, 'toggleWatch');
        }
    }, [currentUser, watchedThreads, setError]);

    const isWatching = useCallback((threadId: string) => watchedThreads.has(threadId), [watchedThreads]);

    const markThreadRead = useCallback(async (threadId: string) => {
        if (!currentUser?.id) return;

        const now = new Date().toISOString();
        setThreadReadTimestamps((prev) => {
            const updated = new Map(prev);
            updated.set(threadId, now);
            return updated;
        });

        setCategoriesState((prev) =>
            prev.map((cat) => ({
                ...cat,
                threads: cat.threads.map((t) =>
                    t.id === threadId ? { ...t, hasUnread: false } : t
                ),
            }))
        );

        try {
            const { error } = await supabase.from('thread_reads').upsert(
                { thread_id: threadId, user_id: currentUser.id, last_read_at: now },
                { onConflict: 'thread_id,user_id' }
            );
            if (error) console.error('[useBookmarksWatches] Failed to mark thread as read:', error);
        } catch (error) {
            console.error('[useBookmarksWatches] Error marking thread as read:', error);
        }
    }, [currentUser?.id, setCategoriesState]);

    // Cleanup on logout
    const resetBookmarksWatches = useCallback(() => {
        setBookmarkedThreads(new Set());
        setWatchedThreads(new Set());
        setThreadReadTimestamps(new Map());
    }, []);

    return {
        toggleBookmark,
        isBookmarked,
        toggleWatch,
        isWatching,
        markThreadRead,
        resetBookmarksWatches,
    };
}
