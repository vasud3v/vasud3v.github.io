import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Clock, MessageCircle, Ban, Users } from 'lucide-react';
import { useFollowSystemEnhanced } from '@/hooks/useFollowSystemEnhanced';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string;
  showMessageButton?: boolean;
  showBlockButton?: boolean;
  showMutualFollowers?: boolean;
  onMessageClick?: () => void;
}

export function FollowButton({ 
  targetUserId, 
  currentUserId, 
  showMessageButton = false,
  showBlockButton = false,
  showMutualFollowers = false,
  onMessageClick 
}: FollowButtonProps) {
  const navigate = useNavigate();
  const { createNotification } = useNotifications();
  const { user } = useAuth();
  const [currentUserData, setCurrentUserData] = useState<{ username: string; avatar: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('forum_users')
        .select('username, avatar')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCurrentUserData(data);
          }
        });
    }
  }, [user?.id]);

  const { 
    followStatus, 
    mutualFollowers,
    loading, 
    blockLoading,
    followUser, 
    unfollowUser,
    blockUser,
    unblockUser
  } = useFollowSystemEnhanced(
    targetUserId,
    currentUserId,
    createNotification,
    currentUserData?.username,
    currentUserData?.avatar
  );

  if (currentUserId === targetUserId) return null;

  const handleMessageClick = () => {
    if (onMessageClick) {
      onMessageClick();
    } else {
      navigate(`/messages?user=${targetUserId}`);
    }
  };

  const isBlocked = followStatus.isBlocked || followStatus.hasBlockedYou;

  return (
    <div className="flex gap-2 items-center">
      {followStatus.hasBlockedYou ? (
        <Button disabled variant="outline" size="sm">
          <Ban className="w-4 h-4 mr-2" />
          Blocked You
        </Button>
      ) : followStatus.isBlocked ? (
        <Button
          onClick={unblockUser}
          disabled={blockLoading}
          variant="outline"
          size="sm"
        >
          <Ban className="w-4 h-4 mr-2" />
          Unblock
        </Button>
      ) : followStatus.isFollowing ? (
        <Button
          onClick={unfollowUser}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          Unfollow
        </Button>
      ) : followStatus.isPending ? (
        <Button
          onClick={unfollowUser}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <Clock className="w-4 h-4 mr-2" />
          Pending
        </Button>
      ) : (
        <Button
          onClick={followUser}
          disabled={loading}
          size="sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </Button>
      )}

      {showMessageButton && followStatus.isFollowing && !isBlocked && (
        <Button
          onClick={handleMessageClick}
          variant="outline"
          size="sm"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Message
        </Button>
      )}

      {showMutualFollowers && mutualFollowers.length > 0 && (
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <Users className="w-4 h-4" />
          {mutualFollowers.length} mutual
        </div>
      )}

      {showBlockButton && !followStatus.hasBlockedYou && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!followStatus.isBlocked && (
              <DropdownMenuItem
                onClick={blockUser}
                disabled={blockLoading}
                className="text-destructive"
              >
                <Ban className="w-4 h-4 mr-2" />
                Block User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
