import { Users, FileText, MessageSquare, Eye, Shield, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import type { ModerationLog } from '@/types/forum';

interface AdminStats {
  totalUsers: number;
  totalThreads: number;
  totalPosts: number;
  onlineUsers: number;
  pendingReports: number;
  bannedUsers: number;
  staffCount: number;
  newUsersToday: number;
}

interface AdminOverviewTabProps {
  stats: AdminStats;
  recentLogs: ModerationLog[];
  onNavigateTab: (tab: string) => void;
  formatDate: (d: string) => string;
}

export default function AdminOverviewTab({ stats, recentLogs, onNavigateTab, formatDate }: AdminOverviewTabProps) {
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-cyan-400' },
    { label: 'Total Threads', value: stats.totalThreads, icon: FileText, color: 'text-forum-pink' },
    { label: 'Total Posts', value: stats.totalPosts, icon: MessageSquare, color: 'text-emerald-400' },
    { label: 'Online Now', value: stats.onlineUsers, icon: Eye, color: 'text-amber-400' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Banned Users', value: stats.bannedUsers, icon: Shield, color: 'text-red-500' },
    { label: 'Staff Members', value: stats.staffCount, icon: Shield, color: 'text-blue-400' },
    { label: 'New Users (24h)', value: stats.newUsersToday, icon: TrendingUp, color: 'text-green-400' },
  ];

  const quickActions = [
    { label: 'Manage Categories', tab: 'categories', icon: FileText },
    { label: 'Manage Threads', tab: 'threads', icon: FileText },
    { label: 'Manage Users', tab: 'users', icon: Users },
    { label: 'View Reports', tab: 'reports', icon: AlertTriangle },
    { label: 'Manage Posts', tab: 'posts', icon: MessageSquare },
    { label: 'Mod Log', tab: 'modlog', icon: Clock },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="hud-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className={stat.color} />
              <span className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-[24px] font-mono font-bold text-forum-text">{stat.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="hud-panel p-4">
        <h3 className="text-[12px] font-mono font-bold text-forum-text mb-3 flex items-center gap-2">
          <Shield size={13} className="text-forum-pink" /> Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.tab}
              onClick={() => onNavigateTab(action.tab)}
              className="transition-forum flex items-center gap-2 rounded-md border border-forum-border/30 bg-forum-bg/50 px-3 py-2.5 text-[10px] font-mono text-forum-muted hover:text-forum-pink hover:border-forum-pink/30"
            >
              <action.icon size={12} /> {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Mod Actions */}
      <div className="hud-panel overflow-hidden">
        <div className="border-b border-forum-border px-4 py-3">
          <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
            <Clock size={13} className="text-forum-pink" /> Recent Moderation Actions
          </h3>
        </div>
        <div className="divide-y divide-forum-border/20">
          {recentLogs.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Clock size={24} className="text-forum-muted/20 mx-auto mb-2" />
              <p className="text-[11px] font-mono text-forum-muted">No moderation actions yet</p>
            </div>
          ) : (
            recentLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 text-[10px] font-mono">
                <Shield size={10} className="text-forum-pink flex-shrink-0" />
                <span className="text-forum-text font-semibold">{log.moderatorName || 'Staff'}</span>
                <span className="text-forum-muted">{log.action.replace(/_/g, ' ')}</span>
                {log.targetUserName && (
                  <span className="text-forum-text">→ {log.targetUserName}</span>
                )}
                <span className="text-forum-muted ml-auto flex-shrink-0">{formatDate(log.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
