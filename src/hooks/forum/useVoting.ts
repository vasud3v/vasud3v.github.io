import { useState, useCallback } from 'react';
import { Category, User } from '@/types/forum';
import { PostData } from '@/types/forum';
import { supabase, ForumError, handleSupabaseError } from '@/lib/supabase';

interface UseVotingParams {
    currentUser: User;
    isAuthenticated: boolean;
    setCategoriesState: React.Dispatch<React.SetStateAction<Category[]>>;
    setPostsMap: React.Dispatch<React.SetStateAction<Record<string, PostData[]>>>;
    setError: (key: string, error: ForumError, operation: string) => void;
}

export function useVoting({
    currentUser,
    isAuthenticated,
    setCategoriesState,
    setPostsMap,
    setError,
}: UseVotingParams) {
    const [threadVotes, setThreadVotes] = useState<Record<string, 'up' | 'down'>>({});
    const [postVotes, setPostVotes] = useState<Record<string, 'up' | 'down'>>({});

    const voteThread = useCallback((threadId: string, direction: 'up' | 'down') => {
        if (!isAuthenticated || !currentUser?.id) return;

        const previousVote = threadVotes[threadId] || null;

        setThreadVotes((prev) => {
            const next = { ...prev };
            if (prev[threadId] === direction) {
                delete next[threadId];
            } else {
                next[threadId] = direction;
            }
            return next;
        });

        let upDelta = 0, downDelta = 0;
        if (previousVote === direction) {
            if (direction === 'up') upDelta = -1; else downDelta = -1;
        } else if (previousVote) {
            if (direction === 'up') { upDelta = 1; downDelta = -1; } else { upDelta = -1; downDelta = 1; }
        } else {
            if (direction === 'up') upDelta = 1; else downDelta = 1;
        }

        setCategoriesState((prev) =>
            prev.map((cat) => ({
                ...cat,
                threads: cat.threads.map((t) => t.id !== threadId ? t : {
                    ...t,
                    upvotes: Math.max(0, t.upvotes + upDelta),
                    downvotes: Math.max(0, t.downvotes + downDelta),
                }),
            }))
        );

        (async () => {
            try {
                if (previousVote === direction) {
                    const { error } = await supabase.from('thread_votes').delete()
                        .eq('thread_id', threadId).eq('user_id', currentUser.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('thread_votes').upsert(
                        { thread_id: threadId, user_id: currentUser.id, direction },
                        { onConflict: 'user_id,thread_id' }
                    );
                    if (error) throw error;
                }

                const { data: voteCounts, error: countError } = await supabase
                    .from('thread_votes').select('direction').eq('thread_id', threadId);
                if (!countError && voteCounts) {
                    const upvotes = voteCounts.filter(v => v.direction === 'up').length;
                    const downvotes = voteCounts.filter(v => v.direction === 'down').length;
                    await supabase.from('threads').update({ upvotes, downvotes }).eq('id', threadId);
                }
            } catch (error) {
                setThreadVotes((prev) => {
                    const next = { ...prev };
                    if (previousVote) next[threadId] = previousVote; else delete next[threadId];
                    return next;
                });
                setCategoriesState((prev) =>
                    prev.map((cat) => ({
                        ...cat,
                        threads: cat.threads.map((t) => t.id !== threadId ? t : {
                            ...t,
                            upvotes: Math.max(0, t.upvotes - upDelta),
                            downvotes: Math.max(0, t.downvotes - downDelta),
                        }),
                    }))
                );
                const forumError = handleSupabaseError(error, 'voteThread');
                setError('voteThread', forumError, 'Vote on thread');
            }
        })();
    }, [threadVotes, currentUser.id, isAuthenticated, setCategoriesState, setError]);

    const getThreadVote = useCallback((threadId: string): 'up' | 'down' | null => {
        return threadVotes[threadId] || null;
    }, [threadVotes]);

    const votePost = useCallback((postId: string, direction: 'up' | 'down') => {
        if (!isAuthenticated || !currentUser?.id) return;

        const previousVote = postVotes[postId] || null;

        setPostVotes((prev) => {
            const next = { ...prev };
            if (prev[postId] === direction) delete next[postId]; else next[postId] = direction;
            return next;
        });

        let upDelta = 0, downDelta = 0;
        if (previousVote === direction) {
            if (direction === 'up') upDelta = -1; else downDelta = -1;
        } else if (previousVote) {
            if (direction === 'up') { upDelta = 1; downDelta = -1; } else { upDelta = -1; downDelta = 1; }
        } else {
            if (direction === 'up') upDelta = 1; else downDelta = 1;
        }

        setPostsMap((prev) => {
            const updated = { ...prev };
            for (const threadId in updated) {
                updated[threadId] = updated[threadId].map((post) =>
                    post.id !== postId ? post : {
                        ...post,
                        upvotes: Math.max(0, post.upvotes + upDelta),
                        downvotes: Math.max(0, post.downvotes + downDelta),
                    }
                );
            }
            return updated;
        });

        (async () => {
            try {
                if (previousVote === direction) {
                    const { error } = await supabase.from('post_votes').delete()
                        .eq('post_id', postId).eq('user_id', currentUser.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('post_votes').upsert(
                        { post_id: postId, user_id: currentUser.id, direction },
                        { onConflict: 'user_id,post_id' }
                    );
                    if (error) throw error;
                }

                const { data: voteCounts, error: countError } = await supabase
                    .from('post_votes').select('direction').eq('post_id', postId);
                if (!countError && voteCounts) {
                    const upvotes = voteCounts.filter(v => v.direction === 'up').length;
                    const downvotes = voteCounts.filter(v => v.direction === 'down').length;
                    await supabase.from('posts').update({ upvotes, downvotes }).eq('id', postId);
                }
            } catch (error) {
                setPostVotes((prev) => {
                    const next = { ...prev };
                    if (previousVote) next[postId] = previousVote; else delete next[postId];
                    return next;
                });
                setPostsMap((prev) => {
                    const updated = { ...prev };
                    for (const threadId in updated) {
                        updated[threadId] = updated[threadId].map((post) =>
                            post.id !== postId ? post : {
                                ...post,
                                upvotes: Math.max(0, post.upvotes - upDelta),
                                downvotes: Math.max(0, post.downvotes - downDelta),
                            }
                        );
                    }
                    return updated;
                });
                const forumError = handleSupabaseError(error, 'votePost');
                setError('votePost', forumError, 'Vote on post');
            }
        })();
    }, [postVotes, currentUser.id, isAuthenticated, setPostsMap, setError]);

    const getPostVote = useCallback((postId: string): 'up' | 'down' | null => {
        return postVotes[postId] || null;
    }, [postVotes]);

    const resetVotes = useCallback(() => {
        setThreadVotes({});
        setPostVotes({});
    }, []);

    return {
        voteThread,
        getThreadVote,
        votePost,
        getPostVote,
        resetVotes,
    };
}
