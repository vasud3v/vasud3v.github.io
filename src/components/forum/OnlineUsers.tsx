import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUserAvatar } from '@/lib/avatar';
import { User } from '@/types/forum';

export default function OnlineUsers() {
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    // Fetch online users from Supabase
    const fetchOnlineUsers = async () => {
      const { data, error } = await supabase
        .from('forum_users')
        .select('*')
        .eq('is_online', true)
        .limit(20);

      if (!error && data) {
        setOnlineUsers(data.map(user => ({
          id: user.id,
          username: user.username,
          avatar: getUserAvatar(user.custom_avatar || user.avatar, user.username),
          postCount: user.post_count,
          reputation: user.reputation,
          joinDate: user.join_date,
          isOnline: user.is_online,
          rank: user.rank,
          role: user.role || 'member',
        })));
      }
    };

    fetchOnlineUsers();

    // Subscribe to real-time updates for all events
    const channel = supabase
      .channel('online-users-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'forum_users' },
        () => {
          // Refetch all online users on any change
          fetchOnlineUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="hud-panel overflow-hidden">
      <div className="border-b border-forum-border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Wifi size={11} className="text-emerald-400" />
          <h4 className="text-[10px] font-bold text-forum-text font-mono uppercase tracking-wider">Online</h4>
        </div>
        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-400/10 border border-emerald-400/25 px-1.5 text-[8px] font-bold text-emerald-400 font-mono">
          {onlineUsers.length}
        </span>
      </div>
      <div className="p-2.5">
        <div className="flex flex-wrap gap-1">
          {onlineUsers.map((user) => (
            <div
              key={user.id}
              className="transition-forum relative group cursor-pointer"
              title={user.username}
              onClick={() => navigate(`/user/${user.id}`)}
            >
              <img
                src={user.avatar}
                alt={user.username}
                className="h-7 w-7 rounded object-cover border border-forum-border group-hover:border-forum-pink/40 transition-forum group-hover:scale-110"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-forum-card bg-emerald-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
