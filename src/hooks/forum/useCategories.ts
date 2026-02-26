import { useState, useEffect, useCallback } from 'react';
import { Thread, Category, ForumStats, User, ReputationEvent, ReputationActionType, REPUTATION_POINTS } from '@/types/forum';
import { PostData } from '@/types/forum';
import { supabase, ForumError, handleSupabaseError, withRetry } from '@/lib/supabase';
import { fetchCategories, fetchForumStats } from '@/lib/forumDataFetchers';

interface UseCategoriesParams {
    currentUser: User;
    isAuthenticated: boolean;
    authUserId: string | undefined;
    pageSize: number;
    setError: (key: string, error: ForumError, operation: string) => void;
    clearError: (key: string) => void;
    setReputationEvents: React.Dispatch<React.SetStateAction<Record<string, ReputationEvent[]>>>;
}

export function useCategories({
    currentUser,
    isAuthenticated,
    authUserId,
    pageSize,
    setError,
    clearError,
    setReputationEvents,
}: UseCategoriesParams) {
    const [categoriesState, setCategoriesState] = useState<Category[]>([]);
    const [statsState, setStatsState] = useState<ForumStats>({
        totalThreads: 0, totalPosts: 0, totalUsers: 0,
        activeUsers: 0, newPostsToday: 0, newestMember: '', onlineUsers: 0,
    });
    const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [threadPages, setThreadPages] = useState<Record<string, number>>({});
    const [hasMoreThreadsMap, setHasMoreThreadsMap] = useState<Record<string, boolean>>({});

    // Fetch categories on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingCategories(true);
            clearError('categories');
            try {
                const categories = await withRetry(() => fetchCategories(authUserId, 0, pageSize));
                if (!cancelled) {
                    setCategoriesState(categories);
                    const initialThreadPages: Record<string, number> = {};
                    const initialHasMoreThreads: Record<string, boolean> = {};
                    categories.forEach(cat => {
                        initialThreadPages[cat.id] = 0;
                        initialHasMoreThreads[cat.id] = cat.threads.length === pageSize;
                    });
                    setThreadPages(initialThreadPages);
                    setHasMoreThreadsMap(initialHasMoreThreads);
                }
            } catch (err) {
                if (!cancelled) {
                    const forumError = handleSupabaseError(err, 'fetchCategories');
                    setError('categories', forumError, 'Fetch categories');
                }
            } finally {
                if (!cancelled) setLoadingCategories(false);
            }
        })();
        return () => { cancelled = true; };
    }, [authUserId, pageSize, clearError, setError]);

    // Fetch forum stats on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingStats(true);
            clearError('stats');
            try {
                const stats = await withRetry(() => fetchForumStats());
                if (!cancelled) setStatsState(stats);
            } catch (err) {
                if (!cancelled) {
                    const forumError = handleSupabaseError(err, 'fetchForumStats');
                    setError('stats', forumError, 'Fetch forum stats');
                }
            } finally {
                if (!cancelled) setLoadingStats(false);
            }
        })();
        return () => { cancelled = true; };
    }, [clearError, setError]);

    const getAllThreads = useCallback(() => categoriesState.flatMap((cat) => cat.threads), [categoriesState]);

    const getThread = useCallback((threadId: string): Thread | null => {
        for (const cat of categoriesState) {
            const found = cat.threads.find((t) => t.id === threadId);
            if (found) return found;
        }
        return null;
    }, [categoriesState]);

    const getCategory = useCallback((categoryId: string): Category | null => {
        return categoriesState.find((c) => c.id === categoryId) || null;
    }, [categoriesState]);

    const getCategoryForThread = useCallback((threadId: string): Category | null => {
        for (const cat of categoriesState) {
            if (cat.threads.some((t) => t.id === threadId)) return cat;
        }
        return null;
    }, [categoriesState]);

    const loadMoreThreads = useCallback(async (categoryId: string): Promise<void> => {
        const currentPage = threadPages[categoryId] || 0;
        const nextPage = currentPage + 1;
        try {
            const from = nextPage * pageSize;
            const to = from + pageSize - 1;
            const { data: threads, error } = await supabase
                .from('threads')
                .select(`*, author:forum_users!threads_author_id_fkey(*), last_reply_by:forum_users!threads_last_reply_by_id_fkey(*)`)
                .eq('category_id', categoryId)
                .order('is_pinned', { ascending: false })
                .order('last_reply_at', { ascending: false })
                .range(from, to);
            if (error) throw error;
            if (!threads || threads.length === 0) {
                setHasMoreThreadsMap(prev => ({ ...prev, [categoryId]: false }));
                return;
            }
            const newThreads: Thread[] = threads.map(t => {
                const tAuthor = Array.isArray(t.author) ? t.author[0] : t.author;
                const tLast = t.last_reply_by ? (Array.isArray(t.last_reply_by) ? t.last_reply_by[0] : t.last_reply_by) : null;
                return {
                    id: t.id, title: t.title, excerpt: t.excerpt,
                    author: { id: tAuthor.id, username: tAuthor.username, avatar: tAuthor.avatar, banner: tAuthor.banner || undefined, postCount: tAuthor.post_count, reputation: tAuthor.reputation, joinDate: tAuthor.join_date, isOnline: tAuthor.is_online, rank: tAuthor.rank || 'Newcomer', role: tAuthor.role || 'member' },
                    categoryId: t.category_id, createdAt: t.created_at, lastReplyAt: t.last_reply_at,
                    lastReplyBy: tLast ? { id: tLast.id, username: tLast.username, avatar: tLast.avatar, banner: tLast.banner || undefined, postCount: tLast.post_count, reputation: tLast.reputation, joinDate: tLast.join_date, isOnline: tLast.is_online, rank: tLast.rank || 'Newcomer', role: tLast.role || 'member' } : undefined as any,
                    replyCount: t.reply_count, viewCount: t.view_count, isPinned: t.is_pinned, isLocked: t.is_locked, isHot: t.is_hot, hasUnread: false, tags: t.tags || [], upvotes: t.upvotes, downvotes: t.downvotes,
                };
            });
            setCategoriesState(prev => prev.map(cat => cat.id === categoryId ? { ...cat, threads: [...cat.threads, ...newThreads] } : cat));
            setThreadPages(prev => ({ ...prev, [categoryId]: nextPage }));
            setHasMoreThreadsMap(prev => ({ ...prev, [categoryId]: threads.length === pageSize }));
            clearError(`threads-${categoryId}`);
        } catch (err) {
            const forumError = handleSupabaseError(err, 'loadMoreThreads');
            setError(`threads-${categoryId}`, forumError, 'Load more threads');
            throw forumError;
        }
    }, [threadPages, pageSize, clearError, setError]);

    const hasMoreThreads = useCallback((categoryId: string): boolean => {
        return hasMoreThreadsMap[categoryId] !== false;
    }, [hasMoreThreadsMap]);

    const createThread = useCallback(async (
        title: string, categoryId: string, content: string,
        tags?: string[],
        poll?: { question: string; options: string[]; isMultipleChoice: boolean; endsAt?: string },
        setPollsMap?: React.Dispatch<React.SetStateAction<Record<string, any>>>,
    ): Promise<Thread> => {
        if (!isAuthenticated || !currentUser?.id) {
            throw new ForumError('User not authenticated', 'AUTH_REQUIRED', 'You must be logged in to create threads.', false);
        }

        const threadId = crypto.randomUUID();
        const now = new Date().toISOString();
        const optimisticThread: Thread = {
            id: threadId, title,
            excerpt: content.slice(0, 120) + (content.length > 120 ? '...' : ''),
            author: currentUser, categoryId, createdAt: now, lastReplyAt: now,
            lastReplyBy: currentUser, replyCount: 0, viewCount: 1,
            isPinned: false, isLocked: false, isHot: false, hasUnread: false,
            tags: tags || [], upvotes: 0, downvotes: 0,
        };

        setCategoriesState((prev) =>
            prev.map((cat) => cat.id === categoryId ? {
                ...cat, threads: [optimisticThread, ...cat.threads],
                threadCount: cat.threadCount + 1, postCount: cat.postCount + 1, lastActivity: now,
            } : cat)
        );

        try {
            const { error: threadError } = await supabase.from('threads').insert({
                id: threadId, title, excerpt: content.slice(0, 120) + (content.length > 120 ? '...' : ''),
                author_id: currentUser.id, category_id: categoryId, tags: tags || [],
                created_at: now, last_reply_at: now, last_reply_by_id: currentUser.id,
            }).select().single();
            if (threadError) throw threadError;

            const { error: postError } = await supabase.from('posts').insert({
                thread_id: threadId, content, author_id: currentUser.id, created_at: now,
            });
            if (postError) throw postError;

            if (poll && poll.options.length >= 2 && setPollsMap) {
                const pollId = crypto.randomUUID();
                const { error: pollError } = await supabase.from('polls').insert({
                    id: pollId, thread_id: threadId, question: poll.question,
                    is_multiple_choice: poll.isMultipleChoice, ends_at: poll.endsAt || null,
                    total_votes: 0, created_at: now,
                });
                if (pollError) throw pollError;

                const pollOptionsData = poll.options.map((optionText, index) => ({
                    id: crypto.randomUUID(), poll_id: pollId, text: optionText, vote_count: 0, position: index,
                }));
                const { error: pollOptionsError } = await supabase.from('poll_options').insert(pollOptionsData);
                if (pollOptionsError) throw pollOptionsError;

                setPollsMap((prev: any) => ({
                    ...prev,
                    [threadId]: {
                        question: poll.question,
                        options: pollOptionsData.map(opt => ({ id: opt.id, text: opt.text, votes: 0 })),
                        totalVotes: 0, endsAt: poll.endsAt || '', isMultipleChoice: poll.isMultipleChoice,
                        hasVoted: false, votedOptionIds: [],
                    },
                }));
            }

            const { error: reputationError } = await supabase.from('reputation_events').insert({
                id: crypto.randomUUID(), user_id: currentUser.id, action: 'thread_created',
                points: REPUTATION_POINTS.thread_created, description: `Created thread "${title}"`,
                thread_id: threadId, thread_title: title, created_at: now,
            });
            if (reputationError) throw reputationError;

            setReputationEvents(prev => ({
                ...prev,
                [currentUser.id]: [{
                    id: crypto.randomUUID(), userId: currentUser.id, action: 'thread_created' as ReputationActionType,
                    points: REPUTATION_POINTS.thread_created, description: `Created thread "${title}"`,
                    threadId, threadTitle: title, createdAt: now,
                }, ...(prev[currentUser.id] || [])],
            }));

            setStatsState((prev) => ({
                ...prev, totalThreads: prev.totalThreads + 1, totalPosts: prev.totalPosts + 1,
                newPostsToday: prev.newPostsToday + 1,
            }));

            return optimisticThread;
        } catch (error) {
            setCategoriesState((prev) =>
                prev.map((cat) => cat.id === categoryId ? {
                    ...cat, threads: cat.threads.filter(t => t.id !== threadId),
                    threadCount: cat.threadCount - 1, postCount: cat.postCount - 1,
                } : cat)
            );
            const forumError = handleSupabaseError(error, 'createThread');
            setError('createThread', forumError, 'Create thread');
            throw forumError;
        }
    }, [currentUser, isAuthenticated, setError, setReputationEvents]);

    return {
        categoriesState,
        setCategoriesState,
        statsState,
        setStatsState,
        loadingCategories,
        loadingStats,
        getAllThreads,
        getThread,
        getCategory,
        getCategoryForThread,
        loadMoreThreads,
        hasMoreThreads,
        createThread,
    };
}
