import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/forum';

interface MentionAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (username: string) => void;
  onClose: () => void;
}

export default function MentionAutocomplete({
  query,
  position,
  onSelect,
  onClose,
}: MentionAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch users matching the query
  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('forum_users')
          .select('id, username, avatar, custom_avatar, rank, reputation, role, post_count, join_date, is_online')
          .ilike('username', `${query}%`)
          .limit(8);

        if (error) throw error;

        const mappedUsers: User[] = (data || []).map((u: any) => ({
          id: u.id,
          username: u.username,
          avatar: u.custom_avatar || u.avatar,
          postCount: u.post_count,
          reputation: u.reputation,
          joinDate: u.join_date,
          isOnline: u.is_online,
          rank: u.rank,
          role: u.role || 'member'
        }));
        setUsers(mappedUsers);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Error fetching users for mention:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (users.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % users.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (users[selectedIndex]) {
            onSelect(users[selectedIndex].username);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelect, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (loading) {
    return (
      <div
        ref={containerRef}
        className="fixed z-[9999] hud-panel p-2 w-[240px]"
        style={{ top: position.top, left: position.left }}
      >
        <div className="text-[10px] font-mono text-forum-muted text-center py-2">
          Searching...
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] hud-panel p-1 w-[240px] max-h-[280px] overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {users.map((user, index) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onSelect(user.username)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-forum ${index === selectedIndex
              ? 'bg-forum-pink/10 border border-forum-pink/30'
              : 'hover:bg-forum-hover border border-transparent'
            }`}
        >
          <img
            src={user.avatar}
            alt={user.username}
            className="h-6 w-6 rounded object-cover border border-forum-border/50"
          />
          <div className="flex-1 text-left min-w-0">
            <div className="text-[11px] font-mono font-bold text-forum-text truncate">
              {user.username}
            </div>
            {user.rank && (
              <div className="text-[8px] font-mono text-forum-muted truncate">
                {user.rank}
              </div>
            )}
          </div>
          {user.reputation !== undefined && (
            <div className="text-[9px] font-mono text-forum-muted">
              {user.reputation > 0 ? `+${user.reputation}` : user.reputation}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
