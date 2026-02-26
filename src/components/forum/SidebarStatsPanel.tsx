import { ForumStats } from '@/types/forum';
import { MessageSquare, FileText, Users, TrendingUp, Activity, ArrowUpRight } from 'lucide-react';

interface SidebarStatsPanelProps {
  stats: ForumStats;
}

const statItems = [
  { key: 'threads', icon: FileText, label: 'Threads', accent: true },
  { key: 'posts', icon: MessageSquare, label: 'Posts', accent: true },
  { key: 'members', icon: Users, label: 'Members', accent: false },
  { key: 'online', icon: TrendingUp, label: 'Online', accent: false },
] as const;

export default function SidebarStatsPanel({ stats }: SidebarStatsPanelProps) {
  const values: Record<string, number> = {
    threads: stats.totalThreads,
    posts: stats.totalPosts,
    members: stats.totalUsers,
    online: stats.onlineUsers,
  };

  return (
    <div className="hud-panel overflow-hidden">
      <div className="border-b border-forum-border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Activity size={11} className="text-forum-pink" />
          <h4 className="text-[10px] font-bold text-forum-text font-mono uppercase tracking-wider">Statistics</h4>
        </div>
        <div className="flex items-center gap-1 text-[8px] font-mono text-forum-muted">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-dot-pulse" />
          Live
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[1px] bg-forum-border/30">
        {statItems.map((item) => {
          const Icon = item.icon;
          const value = values[item.key];
          return (
            <div key={item.key} className="bg-forum-card px-3 py-2.5 group hover:bg-forum-hover transition-forum cursor-default">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`flex h-5 w-5 items-center justify-center rounded-sm ${item.accent ? 'bg-gradient-to-br from-forum-pink/[0.2] to-forum-pink/[0.05] border border-forum-pink/30' : 'bg-forum-bg/50 border border-forum-border/50'}`}>
                  <Icon
                    size={10}
                    className={item.accent ? 'text-forum-pink drop-shadow-[0_0_2px_rgba(255,45,146,0.4)]' : 'text-forum-muted'}
                  />
                </div>
                <span className="text-[8px] font-mono text-forum-muted uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-[14px] font-bold font-mono ${item.accent ? 'text-forum-pink' : 'text-forum-text'}`}>
                  {value.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {stats.newPostsToday > 0 && (
        <div className="px-3 py-2.5 border-t border-forum-border bg-forum-pink/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-gradient-to-br from-forum-pink/[0.2] to-forum-pink/[0.05] border border-forum-pink/30 shadow-[inset_0_0_4px_rgba(255,45,146,0.1)]">
                <ArrowUpRight size={9} className="text-forum-pink drop-shadow-[0_0_2px_rgba(255,45,146,0.4)]" />
              </div>
              <span className="text-[9px] font-mono text-forum-muted">Today's Posts</span>
            </div>
            <span className="text-[13px] font-bold text-forum-pink font-mono text-glow-pink">
              +{stats.newPostsToday}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
