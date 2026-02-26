import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Wrench,
  Rocket,
  Newspaper,
  Shield,
  LucideProps,
} from 'lucide-react';
import { Category } from '@/types/forum';
import ThreadRow from './ThreadRow';

const iconMap: Record<string, React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>> = {
  MessageSquare,
  Wrench,
  Rocket,
  Newspaper,
  Shield,
};

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon = iconMap[category.icon] || MessageSquare;

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="hud-panel overflow-hidden">
      {/* Category header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="transition-forum flex w-full items-center justify-between px-4 py-3.5 hover:bg-forum-hover group">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-gradient-to-br from-forum-pink/[0.15] to-forum-pink/[0.05] border border-forum-pink/30 shadow-[inset_0_0_8px_rgba(255,45,146,0.1)] group-hover:shadow-[inset_0_0_12px_rgba(255,45,146,0.15)] transition-forum">
            <Icon size={18} className="text-forum-pink drop-shadow-[0_0_4px_rgba(255,45,146,0.3)]" />
          </div>
          <div className="text-left">
            <h3 className="text-[13px] font-bold text-forum-text font-mono group-hover:text-forum-pink transition-forum">
              {category.name}
            </h3>
            <p className="text-[11px] text-forum-muted leading-relaxed font-mono">
              {category.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 text-[10px] text-forum-muted sm:flex font-mono">
            <div className="text-right">
              <span className="block text-forum-text font-semibold text-[12px]">
                {category.threadCount.toLocaleString()}
              </span>
              <span className="text-forum-muted uppercase tracking-wider">threads</span>
            </div>
            <div className="text-right">
              <span className="block text-forum-text font-semibold text-[12px]">
                {category.postCount.toLocaleString()}
              </span>
              <span className="text-forum-muted uppercase tracking-wider">posts</span>
            </div>
            <div className="text-right">
              <span className="block text-forum-pink font-semibold text-[12px]">
                {formatTimeAgo(category.lastActivity)}
              </span>
              <span className="text-forum-muted uppercase tracking-wider">last active</span>
            </div>
          </div>
          <div className="transition-forum text-forum-muted group-hover:text-forum-pink">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      {/* Thread list header */}
      {isExpanded && (
        <div className="flex items-center px-4 py-2 border-t border-b border-forum-border bg-forum-bg/50">
          <div className="flex-1 text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted">
            Thread
          </div>
          <div className="hidden sm:flex items-center gap-4 w-[180px] justify-end">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted w-16 text-center">Views</span>
            <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted w-16 text-center">Replies</span>
          </div>
          <div className="hidden lg:block w-28 text-right">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-forum-muted">Last Post</span>
          </div>
        </div>
      )}

      {/* Thread list */}
      <div
        className="transition-all duration-200 ease-out overflow-hidden"
        style={{
          maxHeight: isExpanded ? `${category.threads.length * 120}px` : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div>
          {category.threads.map((thread) => (
            <ThreadRow key={thread.id} thread={thread} />
          ))}
        </div>
      </div>
    </div>
  );
}
