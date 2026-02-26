import { useState, useEffect } from 'react';
import { Hash, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Tag {
  name: string;
  count: number;
  hot?: boolean;
}

export default function PopularTags() {
  const [popularTags, setPopularTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        // Fetch all threads with tags
        const { data: threads, error } = await supabase
          .from('threads')
          .select('tags')
          .not('tags', 'is', null);

        if (error) throw error;

        // Count tag occurrences
        const tagCounts = new Map<string, number>();
        
        if (threads) {
          for (const thread of threads) {
            if (thread.tags && Array.isArray(thread.tags)) {
              for (const tag of thread.tags) {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
              }
            }
          }
        }

        // Convert to array and sort by count
        const sortedTags = Array.from(tagCounts.entries())
          .map(([name, count]) => ({
            name,
            count,
            hot: count > 5, // Mark as hot if used more than 5 times
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12); // Top 12 tags

        setPopularTags(sortedTags);
      } catch (error) {
        console.error('Failed to fetch popular tags:', error);
      }
    };

    fetchPopularTags();

    // Refresh every 5 minutes
    const interval = setInterval(fetchPopularTags, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-panel overflow-hidden">
      <div className="border-b border-forum-border px-3 py-2 flex items-center gap-1.5">
        <Hash size={11} className="text-forum-pink" />
        <h4 className="text-[10px] font-bold text-forum-text font-mono uppercase tracking-wider">
          Popular Tags
        </h4>
      </div>
      <div className="p-2.5">
        {popularTags.length === 0 ? (
          <div className="text-center py-4">
            <Hash size={20} className="text-forum-muted/30 mx-auto mb-2" />
            <p className="text-[9px] font-mono text-forum-muted">
              No tags yet
            </p>
            <p className="text-[8px] font-mono text-forum-muted/60 mt-1">
              Tags will appear as threads are created
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {popularTags.map((tag) => (
              <button
                key={tag.name}
                className={`group transition-forum flex items-center gap-1 rounded-sm px-2 py-[3px] text-[9px] font-mono hover:bg-forum-pink/10 hover:text-forum-pink hover:border-forum-pink/30 hover:shadow-[0_0_8px_rgba(255,45,146,0.15)] ${
                  tag.hot
                    ? 'bg-gradient-to-r from-forum-pink/10 to-forum-pink/[0.03] border border-forum-pink/25 text-forum-pink/80'
                    : 'bg-forum-bg/50 border border-forum-border text-forum-muted'
                }`}
              >
                {tag.hot && (
                  <TrendingUp size={8} className="text-forum-pink/60 group-hover:text-forum-pink transition-forum" />
                )}
                <span className="group-hover:text-forum-pink transition-forum">
                  #{tag.name}
                </span>
                <span className={`text-[7px] ${tag.hot ? 'text-forum-pink/40 bg-forum-pink/10 rounded-sm px-0.5' : 'opacity-50'}`}>
                  {tag.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
