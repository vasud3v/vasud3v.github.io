import { useState, useEffect, useCallback } from 'react';
import { supabase, handleSupabaseError, ForumError } from '@/lib/supabase';

interface UsePostBookmarksParams {
    isAuthenticated: boolean;
    authUserId: string | undefined;
    setError: (key: string, error: ForumError, operation: string) => void;
}

export function usePostBookmarks({
    isAuthenticated,
    authUserId,
    setError,
}: UsePostBookmarksParams) {
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

    // Load bookmarked posts
    useEffect(() => {
        if (!isAuthenticated || !authUserId) {
            setBookmarkedPosts(new Set());
            return;
        }
        
        let cancelled = false;
        
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('post_bookmarks')
                    .select('post_id')
                    .eq('user_id', authUserId);
                
                if (!cancelled && data && !error) {
                    setBookmarkedPosts(new Set(data.map(row => row.post_id)));
                }
            } catch (err) {
                console.warn('Failed to fetch post bookmarks:', err);
            }
        })();
        
        return () => { cancelled = true; };
    }, [isAuthenticated, authUserId]);

    const togglePostBookmark = useCallback(async (postId: string) => {
        if (!authUserId) {
            throw new Error('You must be logged in to bookmark posts');
        }

        if (!isAuthenticated) {
            throw new Error('You must be logged in to bookmark posts');
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

        const wasBookmarked = bookmarkedPosts.has(postId);
        
        // Optimistic update
        setBookmarkedPosts((prev) => {
            const next = new Set(prev);
            wasBookmarked ? next.delete(postId) : next.add(postId);
            return next;
        });

        try {
            if (wasBookmarked) {
                const { error } = await supabase
                    .from('post_bookmarks')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', authUserId);
                
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('post_bookmarks')
                    .insert({
                        post_id: postId,
                        user_id: authUserId,
                    });
                
                if (error) throw error;
            }
        } catch (error: any) {
            // Rollback optimistic update
            setBookmarkedPosts((prev) => {
                const next = new Set(prev);
                wasBookmarked ? next.add(postId) : next.delete(postId);
                return next;
            });
            
            const forumError = handleSupabaseError(error, 'togglePostBookmark');
            setError(`post-bookmark-${postId}`, forumError, 'togglePostBookmark');
            
            // Provide user-friendly error message
            if (error.code === '23503') {
                throw new Error('Your forum profile is not set up correctly. Please contact an administrator.');
            } else if (error.code === '42501') {
                throw new Error('You do not have permission to bookmark posts.');
            } else {
                throw new Error(error.message || 'Failed to bookmark post');
            }
        }
    }, [authUserId, bookmarkedPosts, isAuthenticated, setError]);

    const isPostBookmarked = useCallback((postId: string) => {
        return bookmarkedPosts.has(postId);
    }, [bookmarkedPosts]);

    const resetPostBookmarks = useCallback(() => {
        setBookmarkedPosts(new Set());
    }, []);

    return {
        togglePostBookmark,
        isPostBookmarked,
        resetPostBookmarks,
    };
}
