import { useState } from 'react';
import { AlertTriangle, Check, X, Ban, Trash2, Eye, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import type { ContentReport, ReportStatus } from '@/types/forum';

interface Props {
  reports: ContentReport[];
  currentUserId: string;
  onRefresh: () => void;
  onLogAction: (action: string, targetType: string, targetId: string, details?: Record<string, any>, targetUserId?: string) => Promise<void>;
  formatDate: (d: string) => string;
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  resolved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  dismissed: 'text-forum-muted bg-forum-hover border-forum-border/20',
};

export default function AdminReportsTab({ reports, currentUserId, onRefresh, onLogAction, formatDate }: Props) {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending');
  const [actionModal, setActionModal] = useState<{ reportId: string; action: string } | null>(null);

  const filtered = reports.filter(r => statusFilter === 'all' || r.status === statusFilter);
  const pendingCount = reports.filter(r => r.status === 'pending').length;

  const handleResolve = async (reportId: string, action: string) => {
    try {
      const { error } = await supabase.from('content_reports').update({
        status: action === 'dismiss' ? 'dismissed' : 'resolved',
        resolved_by: currentUserId,
        resolved_at: new Date().toISOString(),
        action_taken: action,
      }).eq('id', reportId);
      if (error) throw error;

      const report = reports.find(r => r.id === reportId);

      // If action is delete_content, also delete the target
      if (action === 'delete_content' && report) {
        const table = report.targetType === 'thread' ? 'threads' : 'posts';
        await supabase.from(table).delete().eq('id', report.targetId);
      }

      // If action is ban_user, ban the author
      if (action === 'ban_user' && report) {
        // We'd need the author's ID — for now log it
        await onLogAction('report_resolve', 'report', reportId, { action, reason: report.reason });
      } else {
        const logAction = action === 'dismiss' ? 'report_dismiss' : 'report_resolve';
        await onLogAction(logAction, 'report', reportId, { action, reason: report?.reason });
      }

      toast.success(action === 'dismiss' ? 'Report dismissed' : 'Report resolved');
      setActionModal(null);
      onRefresh();
    } catch {
      toast.error('Failed to process report');
    }
  };

  return (
    <div className="space-y-3">
      {/* Status filter tabs */}
      <div className="flex items-center gap-1">
        {(['all', 'pending', 'resolved', 'dismissed'] as const).map(status => (
          <button key={status} onClick={() => setStatusFilter(status)}
            className={`transition-forum rounded-md px-3 py-1.5 text-[10px] font-mono font-medium capitalize ${
              statusFilter === status
                ? 'bg-forum-pink/10 text-forum-pink border border-forum-pink/20'
                : 'text-forum-muted hover:text-forum-text hover:bg-forum-hover'
            }`}>
            {status} {status === 'pending' && pendingCount > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-[1px] text-[8px] text-white">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="hud-panel overflow-hidden">
        <div className="border-b border-forum-border px-4 py-3">
          <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
            <AlertTriangle size={13} className="text-forum-pink" /> Reports ({filtered.length})
          </h3>
        </div>
        <div className="divide-y divide-forum-border/20 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <AlertTriangle size={30} className="text-forum-muted/20 mx-auto mb-2" />
              <p className="text-[11px] font-mono text-forum-muted">No {statusFilter === 'all' ? '' : statusFilter} reports</p>
            </div>
          ) : filtered.map(report => (
            <div key={report.id} className="px-4 py-3 hover:bg-forum-hover/30 transition-forum">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[8px] font-mono border rounded-sm px-1.5 py-[1px] capitalize ${STATUS_COLORS[report.status]}`}>{report.status}</span>
                    <span className="text-[9px] font-mono text-forum-muted uppercase">{report.targetType}</span>
                    <span className="text-[9px] font-mono text-amber-400 capitalize">{report.reason.replace('_', ' ')}</span>
                  </div>
                  {report.targetTitle && (
                    <p className="text-[10px] font-mono text-forum-text mb-0.5">"{report.targetTitle}"</p>
                  )}
                  {report.targetContent && (
                    <p className="text-[9px] font-mono text-forum-muted line-clamp-2 mb-1">{report.targetContent.replace(/<[^>]*>/g, '').slice(0, 150)}</p>
                  )}
                  {report.details && (
                    <p className="text-[9px] font-mono text-forum-muted italic">Details: {report.details}</p>
                  )}
                  <div className="flex items-center gap-3 text-[8px] font-mono text-forum-muted mt-1">
                    <span>Reported by: {report.reporterName || 'Unknown'}</span>
                    {report.targetAuthorName && <span>Author: {report.targetAuthorName}</span>}
                    <span className="flex items-center gap-0.5"><Clock size={7} /> {formatDate(report.createdAt)}</span>
                    {report.actionTaken && <span className="text-emerald-400">Action: {report.actionTaken}</span>}
                  </div>
                </div>
                {report.status === 'pending' && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => handleResolve(report.id, 'dismiss')}
                      className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-text hover:bg-forum-hover" title="Dismiss"><X size={11} /></button>
                    <button onClick={() => handleResolve(report.id, 'warn_user')}
                      className="transition-forum rounded p-1.5 text-forum-muted hover:text-amber-400 hover:bg-amber-500/10" title="Warn User"><AlertTriangle size={11} /></button>
                    <button onClick={() => handleResolve(report.id, 'delete_content')}
                      className="transition-forum rounded p-1.5 text-forum-muted hover:text-red-400 hover:bg-red-500/10" title="Delete Content"><Trash2 size={11} /></button>
                    <button onClick={() => handleResolve(report.id, 'resolved')}
                      className="transition-forum rounded p-1.5 text-forum-muted hover:text-emerald-400 hover:bg-emerald-500/10" title="Mark Resolved"><Check size={11} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
