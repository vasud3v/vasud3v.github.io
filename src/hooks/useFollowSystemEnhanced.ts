import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import { CreateNotificationData } from '@/hooks/forum/useNotifications';

export interface FollowStatus {
  isFollowing: boolean;
  isPending: boolean;
  isFollower: boolean;
  isBlocked: boolean;
  hasBlockedYou: boolean;
  status: 'none' | 'pending' | 'accepted' | 'rejected';
}

export interface MutualFollower {
  user_id: string;
  username: string;
  avatar: string;
}

export function useFollowSystemEnhanced(
  targetUserId: string,
  currentUserId: string,
  createNotification?: (data: CreateNotificationData) => Promise<void>,
  currentUserName?: string,
  currentUserAvatar?: string,
) {
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    isPending: false,
    isFollower: false,
    isBlocked: false,
    hasBlockedYou: false,
    status: 'none'
  });
  const [mutualFollowers, setMutualFollowers] = useState<MutualFollower[]>([]);
  const [loading, setLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;

    fetchFollowStatus();
    fetchMutualFollowers();

    // Subscribe to follow changes
    const channel = supabase
      .channel(`follow-enhanced-${currentUserId}-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `follower_id=eq.${currentUserId},following_id=eq.${targetUserId}`
        },
        () => {
          fetchFollowStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_blocks',
        },
        () => {
          fetchFollowStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, targetUserId]);

  const fetchFollowStatus = async () => {
    try {
      // Check if current user follows target
      const { data: followData } = await supabase
        .from('user_follows')
        .select('status')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      // Check if target follows current user
      const { data: followerData } = await supabase
        .from('user_follows')
        .select('status')
        .eq('follower_id', targetUserId)
        .eq('following_id', currentUserId)
        .maybeSingle();

      // Check block status
      const { data: isBlocked } = await supabase
        .rpc('is_user_blocked', { target_user_id: targetUserId });

      // Check if target has blocked current user
      const { data: blockData } = await supabase
        .from('user_blocks')
        .select('blocker_id')
        .eq('blocker_id', targetUserId)
        .eq('blocked_id', currentUserId)
        .maybeSingle();

      setFollowStatus({
        isFollowing: followData?.status === 'accepted',
        isPending: followData?.status === 'pending',
        isFollower: followerData?.status === 'accepted',
        isBlocked: isBlocked || false,
        hasBlockedYou: !!blockData,
        status: followData?.status || 'none'
      });
    } catch (error) {
      console.error('Error fetching follow status:', error);
    }
  };

  const fetchMutualFollowers = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_mutual_followers', { target_user_id: targetUserId });

      if (error) throw error;
      setMutualFollowers(data || []);
    } catch (error) {
      console.error('Error fetching mutual followers:', error);
    }
  };

  const followUser = async () => {
    if (!currentUserId || !targetUserId) return;

    if (currentUserId === 'guest') {
      toast.error('Please log in to follow users');
      return;
    }

    if (followStatus.isBlocked || followStatus.hasBlockedYou) {
      toast.error('Cannot follow this user');
      return;
    }

    setLoading(true);
    try {
      // Check if target user is private
      const { data: targetUser } = await supabase
        .from('forum_users')
        .select('is_private, username')
        .eq('id', targetUserId)
        .single();

      const status = targetUser?.is_private ? 'pending' : 'accepted';

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: currentUserId,
          following_id: targetUserId,
          status
        });

      if (error) {
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          throw new Error('Please log in to follow users');
        }
        if (error.message.includes('duplicate key')) {
          throw new Error('You already follow this user');
        }
        throw error;
      }

      const message = status === 'pending'
        ? `Follow request sent to ${targetUser?.username}`
        : `Now following ${targetUser?.username}`;
      toast.success(message);

      // Notify target user
      if (createNotification) {
        await createNotification({
          userId: targetUserId,
          type: status === 'pending' ? 'follow_request' : 'follow',
          title: status === 'pending' ? 'Follow Request' : 'New Follower',
          message: status === 'pending'
            ? `${currentUserName || 'Someone'} sent you a follow request`
            : `${currentUserName || 'Someone'} started following you`,
          link: `/user/${currentUserId}`,
          actorId: currentUserId,
          actorName: currentUserName,
          actorAvatar: currentUserAvatar,
          targetType: 'user',
          targetId: targetUserId,
        });
      }

      fetchFollowStatus();
      fetchMutualFollowers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to follow user');
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async () => {
    if (!currentUserId || !targetUserId) return;

    if (currentUserId === 'guest') {
      toast.error('Please log in to unfollow users');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

      if (error) {
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          throw new Error('Please log in to unfollow users');
        }
        throw error;
      }

      toast.success('You have unfollowed this user');

      fetchFollowStatus();
      fetchMutualFollowers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to unfollow user');
    } finally {
      setLoading(false);
    }
  };

  const blockUser = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;

    setBlockLoading(true);
    try {
      const { error } = await supabase
        .rpc('block_user', { target_user_id: targetUserId });

      if (error) throw error;

      toast.success('User blocked successfully');
      fetchFollowStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to block user');
    } finally {
      setBlockLoading(false);
    }
  }, [currentUserId, targetUserId]);

  const unblockUser = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;

    setBlockLoading(true);
    try {
      const { error } = await supabase
        .rpc('unblock_user', { target_user_id: targetUserId });

      if (error) throw error;

      toast.success('User unblocked successfully');
      fetchFollowStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to unblock user');
    } finally {
      setBlockLoading(false);
    }
  }, [currentUserId, targetUserId]);

  const acceptFollowRequest = async (followerId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('follower_id', followerId)
        .eq('following_id', currentUserId);

      if (error) throw error;

      toast.success('Follow request accepted');

      fetchFollowStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept request');
    } finally {
      setLoading(false);
    }
  };

  const rejectFollowRequest = async (followerId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', currentUserId);

      if (error) throw error;

      toast.success('Follow request rejected');

      fetchFollowStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  return {
    followStatus,
    mutualFollowers,
    loading,
    blockLoading,
    followUser,
    unfollowUser,
    blockUser,
    unblockUser,
    acceptFollowRequest,
    rejectFollowRequest,
    refreshStatus: fetchFollowStatus,
    refreshMutualFollowers: fetchMutualFollowers
  };
}
