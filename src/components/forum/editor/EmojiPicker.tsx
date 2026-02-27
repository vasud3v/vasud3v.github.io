import { Smile, X, Search } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { COMMON_EMOJIS } from '@/lib/forumConstants';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  iconSize?: number;
}

// Emoji categories with names for searchability
const EMOJI_DATA = [
  { emoji: '😀', name: 'grinning', category: 'smileys' },
  { emoji: '😂', name: 'joy', category: 'smileys' },
  { emoji: '🤔', name: 'thinking', category: 'smileys' },
  { emoji: '😎', name: 'cool', category: 'smileys' },
  { emoji: '👍', name: 'thumbs up', category: 'gestures' },
  { emoji: '👎', name: 'thumbs down', category: 'gestures' },
  { emoji: '🤝', name: 'handshake', category: 'gestures' },
  { emoji: '🔥', name: 'fire', category: 'symbols' },
  { emoji: '💡', name: 'lightbulb idea', category: 'symbols' },
  { emoji: '❤️', name: 'heart love', category: 'symbols' },
  { emoji: '🎉', name: 'party celebration', category: 'symbols' },
  { emoji: '👀', name: 'eyes watching', category: 'symbols' },
  { emoji: '🚀', name: 'rocket launch', category: 'symbols' },
  { emoji: '💯', name: 'hundred perfect', category: 'symbols' },
  { emoji: '🐛', name: 'bug', category: 'symbols' },
  { emoji: '⚡', name: 'lightning fast', category: 'symbols' },
  { emoji: '🤖', name: 'robot', category: 'symbols' },
  { emoji: '🎯', name: 'target bullseye', category: 'symbols' },
  { emoji: '✅', name: 'check done', category: 'symbols' },
  { emoji: '❌', name: 'cross error', category: 'symbols' },
  { emoji: '⚠️', name: 'warning', category: 'symbols' },
  { emoji: '💀', name: 'skull dead', category: 'symbols' },
  { emoji: '🧠', name: 'brain smart', category: 'symbols' },
  { emoji: '💻', name: 'laptop computer', category: 'objects' },
  { emoji: '🔧', name: 'wrench tool', category: 'objects' },
  { emoji: '📦', name: 'package box', category: 'objects' },
  { emoji: '🎨', name: 'art palette', category: 'objects' },
  { emoji: '🛡️', name: 'shield protection', category: 'objects' },
  { emoji: '☕', name: 'coffee', category: 'objects' },
  { emoji: '🌟', name: 'star sparkle', category: 'symbols' },
];

export default function EmojiPicker({ onSelect, iconSize = 12 }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent_emojis');
    if (stored) {
      try {
        setRecentEmojis(JSON.parse(stored));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Filter emojis by search
  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return EMOJI_DATA;
    const query = search.toLowerCase();
    return EMOJI_DATA.filter(e => e.name.includes(query) || e.category.includes(query));
  }, [search]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
    setSearch('');

    // Update recent emojis
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 8);
    setRecentEmojis(updated);
    localStorage.setItem('recent_emojis', JSON.stringify(updated));
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`transition-forum rounded p-1.5 hover:bg-forum-pink/5 ${
          open ? 'text-forum-pink bg-forum-pink/10' : 'text-forum-muted hover:text-forum-pink'
        }`}
        title="Emoji Picker"
      >
        <Smile size={iconSize} />
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-1 z-20 hud-panel w-[280px] p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] font-mono font-bold text-forum-muted uppercase tracking-wider">
              Emoji Picker
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-forum-muted hover:text-forum-text transition-forum"
            >
              <X size={10} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-forum-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search emojis..."
              className="w-full bg-forum-bg border border-forum-border/30 rounded pl-7 pr-2 py-1 text-[10px] font-mono text-forum-text placeholder:text-forum-muted/40 focus:outline-none focus:border-forum-pink/50"
            />
          </div>

          {/* Recent Emojis */}
          {recentEmojis.length > 0 && !search && (
            <div className="mb-2">
              <div className="text-[8px] font-mono text-forum-muted uppercase tracking-wider mb-1">
                Recent
              </div>
              <div className="grid grid-cols-10 gap-0.5">
                {recentEmojis.map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className="transition-forum rounded p-1 text-[14px] hover:bg-forum-pink/10 hover:scale-125 transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Emojis */}
          <div className="max-h-[200px] overflow-y-auto">
            {filteredEmojis.length === 0 ? (
              <div className="text-center py-4 text-[10px] font-mono text-forum-muted">
                No emojis found
              </div>
            ) : (
              <div className="grid grid-cols-10 gap-0.5">
                {filteredEmojis.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(item.emoji)}
                    className="transition-forum rounded p-1 text-[14px] hover:bg-forum-pink/10 hover:scale-125 transform"
                    title={item.name}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
