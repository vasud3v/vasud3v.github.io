import { Flame, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForumContext } from '@/context/ForumContext';

export default function TrendingTicker() {
  const navigate = useNavigate();
  const { getAllThreads } = useForumContext();
  const allThreads = getAllThreads();
  const hotThreads = allThreads
    .filter((t) => t.isHot || t.viewCount > 2000)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 6);

  return (
    <div className="hud-panel overflow-hidden">
      <div className="flex items-stretch">
        {/* Label */}
        <div className="flex items-center gap-1.5 bg-forum-pink/10 border-r border-forum-border px-4 py-2.5 flex-shrink-0">
          <TrendingUp size={12} className="text-forum-pink" />
          <span className="text-[10px] font-mono font-bold text-forum-pink uppercase tracking-wider whitespace-nowrap">
            Trending
          </span>
        </div>

        {/* Scrolling content */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-6 px-4 py-2.5 animate-scroll-ticker">
            {[...hotThreads, ...hotThreads].map((thread, idx) => (
              <button
                key={`${thread.id}-${idx}`}
                onClick={() => navigate(`/thread/${thread.id}`)}
                className="flex items-center gap-2 whitespace-nowrap group transition-forum"
              >
                {thread.isHot && (
                  <Flame size={10} className="text-forum-muted flex-shrink-0" />
                )}
                <span className="text-[11px] font-mono text-forum-muted group-hover:text-forum-pink transition-forum">
                  {thread.title.length > 45 ? thread.title.slice(0, 45) + '...' : thread.title}
                </span>
                <span className="text-[9px] font-mono text-forum-muted/50 flex items-center gap-0.5">
                  <ArrowRight size={8} />
                  {thread.viewCount.toLocaleString()} views
                </span>
              </button>
            ))}
          </div>
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-forum-card to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-forum-card to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
