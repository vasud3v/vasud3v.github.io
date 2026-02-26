import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ForumHeader from '@/components/forum/ForumHeader';
import PostEditHistoryModal from '@/components/forum/PostEditHistoryModal';
import ImprovedPostCard from '@/components/forum/ImprovedPostCard';
import RoleBadge from '@/components/forum/RoleBadge';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import MobileBottomNav from '@/components/forum/MobileBottomNav';
import SidebarStatsPanel from '@/components/forum/SidebarStatsPanel';
import UserProfileMiniCard from '@/components/forum/UserProfileMiniCard';
import OnlineUsers from '@/components/forum/OnlineUsers';
import PopularTags from '@/components/forum/PopularTags';
import FloatingActionButton from '@/components/forum/FloatingActionButton';
import NewThreadModal from '@/components/forum/NewThreadModal';
import ImageUploadButton from '@/components/forum/ImageUploadButton';
import { PostData, useForumContext } from '@/context/ForumContext';
import { EmbedRenderer } from '@/components/forum/EmbedRenderer';
import { parseEmbeddableUrl, isStandaloneUrl } from '@/lib/embed-parser';
import {
  Home as HomeIcon,
  ChevronRight,
  Pin,
  Lock,
  Flame,
  Eye,
  MessageCircle,
  Clock,
  Quote,
  Share2,
  Flag,
  Bookmark,
  CheckCircle2,
  TrendingUp,
  Code,
  Heart,
  Award,
  Reply,
  Crown,
  ShieldCheck,
  Gem,
  Cog,
  Zap as SwordsIcon,
  User,
  SearchX,
  Bell,
  BellOff,
  BarChart3,
  ChevronsUp,
  ChevronsDown,
  Copy,
  Check,
  History,
  ArrowUp,
  Smile,
  ExternalLink,
  AtSign,
  Bold,
  Italic,
  List,
  LinkIcon,
  Hash,
  X,
  Link2,
  Pencil,
  Table,
  EyeOff,
  Paperclip,
  Strikethrough,
  Heading,
  ChevronUp,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { UserRole } from '@/types/forum';

// ============================================================================
// Types (imported from ForumContext)
// ============================================================================

// Re-export for compatibility with sub-components
type Reaction = { emoji: string; label: string; count: number; reacted: boolean };

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollData {
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt: string;
  isMultipleChoice: boolean;
  hasVoted: boolean;
  votedOptionIds: string[];
}

// ============================================================================
// Helpers
// ============================================================================

const getRankColor = (rank?: string) => {
  switch (rank) {
    case 'Administrator':
      return 'text-red-400 bg-gradient-to-r from-red-500/15 to-red-500/5 border-red-500/40 badge-glow-red';
    case 'Moderator':
      return 'text-purple-400 bg-gradient-to-r from-purple-500/15 to-purple-500/5 border-purple-500/40 badge-glow-purple';
    case 'Elite Hacker':
      return 'text-forum-pink bg-gradient-to-r from-forum-pink/15 to-forum-pink/5 border-forum-pink/40 badge-glow-pink';
    case 'Senior Dev':
      return 'text-cyan-400 bg-gradient-to-r from-cyan-500/15 to-cyan-500/5 border-cyan-500/40 badge-glow-cyan';
    case 'Code Ninja':
      return 'text-emerald-400 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border-emerald-500/40 badge-glow-emerald';
    default:
      return 'text-forum-muted bg-forum-hover border-forum-border';
  }
};

const getRankIcon = (rank?: string) => {
  switch (rank) {
    case 'Administrator':
      return <Crown size={8} />;
    case 'Moderator':
      return <ShieldCheck size={8} />;
    case 'Elite Hacker':
      return <Gem size={8} />;
    case 'Senior Dev':
      return <Cog size={8} />;
    case 'Code Ninja':
      return <SwordsIcon size={8} />;
    default:
      return <User size={8} />;
  }
};

// ============================================================================
// Sub-Components
// ============================================================================

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDaysLeft = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / (24 * 3600000));
  const hours = Math.floor((diff % (24 * 3600000)) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
};

// ============================================================================
// Sub-Components
// ============================================================================

// --- Thread Poll ---
function ThreadPoll({ poll: initialPoll, threadId }: { poll: PollData; threadId: string }) {
  const { votePoll } = useForumContext();
  const [poll, setPoll] = useState(initialPoll);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    initialPoll.votedOptionIds
  );
  const isExpired = new Date(poll.endsAt).getTime() <= Date.now();
  const showResults = poll.hasVoted || isExpired;

  // Update local state when initialPoll changes (from real-time updates)
  useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);

  const handleVote = () => {
    if (selectedOptions.length === 0 || poll.hasVoted) return;
    // Call the votePoll function from context
    votePoll(threadId, selectedOptions);
  };

  const toggleOption = (optId: string) => {
    if (poll.hasVoted || isExpired) return;
    if (poll.isMultipleChoice) {
      setSelectedOptions((prev) =>
        prev.includes(optId)
          ? prev.filter((id) => id !== optId)
          : [...prev, optId]
      );
    } else {
      setSelectedOptions([optId]);
    }
  };

  const maxVotes = Math.max(...poll.options.map((o) => o.votes));

  return (
    <div className="hud-panel overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-forum-border/20 bg-forum-card-alt/30">
        <BarChart3 size={13} className="text-forum-pink" />
        <span className="text-[11px] font-mono font-bold text-forum-text uppercase tracking-wider">
          Poll
        </span>
        {poll.isMultipleChoice && (
          <span className="text-[8px] font-mono text-forum-muted bg-forum-bg px-1.5 py-0.5 rounded-sm border border-forum-border/30">
            Multiple Choice
          </span>
        )}
        <span className="ml-auto text-[9px] font-mono text-forum-muted">
          {poll.totalVotes.toLocaleString()} votes ·{' '}
          {formatDaysLeft(poll.endsAt)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-[13px] font-mono font-bold text-forum-text">
          {poll.question}
        </h3>

        <div className="space-y-2">
          {poll.options.map((option) => {
            const pct =
              poll.totalVotes > 0
                ? (option.votes / poll.totalVotes) * 100
                : 0;
            const isSelected = selectedOptions.includes(option.id);
            const isWinning = option.votes === maxVotes && showResults;

            return (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                disabled={poll.hasVoted || isExpired}
                className={`relative w-full text-left rounded-md border overflow-hidden transition-forum ${isSelected && !showResults
                  ? 'border-forum-pink/50 bg-forum-pink/[0.06]'
                  : isSelected && showResults
                    ? 'border-forum-pink/40 bg-forum-pink/[0.04]'
                    : 'border-forum-border/30 bg-forum-bg/50 hover:border-forum-border/50'
                  } ${poll.hasVoted || isExpired ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {showResults && (
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${isWinning ? 'bg-forum-pink/15' : 'bg-forum-border/20'
                      }`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    {!showResults && (
                      <div
                        className={`h-3.5 w-3.5 rounded-sm border flex items-center justify-center ${isSelected
                          ? 'border-forum-pink bg-forum-pink/20'
                          : 'border-forum-border/50'
                          }`}
                      >
                        {isSelected && (
                          <Check size={8} className="text-forum-pink" />
                        )}
                      </div>
                    )}
                    <span
                      className={`text-[11px] font-mono ${isWinning ? 'text-forum-pink font-semibold' : 'text-forum-text'}`}
                    >
                      {option.text}
                    </span>
                    {isSelected && showResults && (
                      <span className="text-[8px] font-mono text-forum-pink bg-forum-pink/10 px-1 py-0.5 rounded-sm">
                        Your vote
                      </span>
                    )}
                  </div>
                  {showResults && (
                    <span
                      className={`text-[10px] font-mono font-semibold ${isWinning ? 'text-forum-pink' : 'text-forum-muted'}`}
                    >
                      {pct.toFixed(1)}% ({option.votes})
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!poll.hasVoted && !isExpired && (
          <button
            onClick={handleVote}
            disabled={selectedOptions.length === 0}
            className="transition-forum rounded-md bg-forum-pink px-4 py-1.5 text-[10px] font-mono font-semibold text-white hover:shadow-pink-glow active:scale-95 border border-forum-pink/50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Cast Vote
          </button>
        )}
      </div>
    </div>
  );
}

// --- Post Reactions Bar ---
function ReactionsBar({
  reactions: initialReactions,
}: {
  reactions: Reaction[];
}) {
  const [reactions, setReactions] = useState(initialReactions);
  const [showPicker, setShowPicker] = useState(false);

  const availableReactions = [
    { emoji: '👍', label: 'Helpful' },
    { emoji: '❤️', label: 'Love' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '💡', label: 'Insightful' },
    { emoji: '😂', label: 'Funny' },
    { emoji: '🎯', label: 'On Point' },
    { emoji: '🤔', label: 'Thinking' },
    { emoji: '👀', label: 'Watching' },
  ];

  const toggleReaction = (emoji: string, label: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        if (existing.reacted) {
          return existing.count <= 1
            ? prev.filter((r) => r.emoji !== emoji)
            : prev.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, reacted: false }
                : r
            );
        }
        return prev.map((r) =>
          r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r
        );
      }
      return [...prev, { emoji, label, count: 1, reacted: true }];
    });
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap relative">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction(r.emoji, r.label)}
          className={`transition-forum flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono border ${r.reacted
            ? 'border-forum-pink/30 bg-forum-pink/10 text-forum-pink'
            : 'border-forum-border/30 bg-forum-bg/50 text-forum-muted hover:border-forum-pink/20 hover:text-forum-text'
            }`}
          title={r.label}
        >
          <span className="text-[11px]">{r.emoji}</span>
          <span className="font-semibold">{r.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="transition-forum flex items-center justify-center h-5 w-5 rounded-full border border-forum-border/30 bg-forum-bg/50 text-forum-muted hover:border-forum-pink/20 hover:text-forum-pink"
          title="Add reaction"
        >
          <Smile size={9} />
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 z-20 hud-panel p-1.5 flex gap-1">
            {availableReactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => toggleReaction(r.emoji, r.label)}
                className="transition-forum h-6 w-6 rounded flex items-center justify-center hover:bg-forum-pink/10 text-[13px]"
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Share Modal ---
function ShareModal({
  isOpen,
  onClose,
  threadTitle,
  threadId,
}: {
  isOpen: boolean;
  onClose: () => void;
  threadTitle: string;
  threadId: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/thread/${threadId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative hud-panel w-[400px] max-w-[90vw] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-forum-border/20">
          <span className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
            <Share2 size={13} className="text-forum-pink" /> Share Thread
          </span>
          <button
            onClick={onClose}
            className="text-forum-muted hover:text-forum-text transition-forum"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-[11px] font-mono text-forum-muted line-clamp-2">
            {threadTitle}
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-forum-bg border border-forum-border/30 rounded-md px-3 py-2 text-[10px] font-mono text-forum-text truncate">
              {url}
            </div>
            <button
              onClick={handleCopy}
              className={`transition-forum rounded-md px-3 py-2 text-[10px] font-mono font-semibold border ${copied
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-forum-pink/10 border-forum-pink/30 text-forum-pink hover:bg-forum-pink/20'
                }`}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(threadTitle)}&url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-forum flex items-center justify-center gap-1.5 rounded-md border border-forum-border/30 bg-forum-bg/50 py-2 text-[9px] font-mono text-forum-muted hover:text-forum-pink hover:border-forum-pink/30"
            >
              <ExternalLink size={10} /> Twitter/X
            </a>
            <a
              href={`https://reddit.com/submit?title=${encodeURIComponent(threadTitle)}&url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-forum flex items-center justify-center gap-1.5 rounded-md border border-forum-border/30 bg-forum-bg/50 py-2 text-[9px] font-mono text-forum-muted hover:text-orange-400 hover:border-orange-500/30"
            >
              <ExternalLink size={10} /> Reddit
            </a>
            <button
              onClick={handleCopy}
              className="transition-forum flex items-center justify-center gap-1.5 rounded-md border border-forum-border/30 bg-forum-bg/50 py-2 text-[9px] font-mono text-forum-muted hover:text-forum-text hover:border-forum-border/50"
            >
              <Link2 size={10} /> Copy Link
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="text-[9px] font-mono text-forum-muted uppercase tracking-wider">
              Embed Code
            </span>
            <div className="bg-forum-bg border border-forum-border/30 rounded-md px-3 py-2 text-[9px] font-mono text-forum-pink/80 break-all">
              {`<iframe src="${url}?embed=true" width="600" height="400" frameborder="0"></iframe>`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Thread Navigation Bar ---
function ThreadNavBar({
  postCount,
  onScrollToTop,
  onScrollToBottom,
}: {
  postCount: number;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
}) {
  return (
    <div className="hud-panel flex items-center justify-between px-4 py-2">
      <span className="text-[10px] font-mono text-forum-muted">
        <span className="text-forum-text font-semibold">{postCount}</span>{' '}
        posts in this thread
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onScrollToTop}
          className="transition-forum flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-mono text-forum-muted border border-forum-border/30 hover:text-forum-pink hover:border-forum-pink/30"
          title="Jump to first post"
        >
          <ChevronsUp size={10} /> First
        </button>
        <button
          onClick={onScrollToBottom}
          className="transition-forum flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-mono text-forum-muted border border-forum-border/30 hover:text-forum-pink hover:border-forum-pink/30"
          title="Jump to last post"
        >
          <ChevronsDown size={10} /> Last
        </button>
      </div>
    </div>
  );
}

// --- Related Threads Sidebar ---
function RelatedThreads({
  currentThread,
  categoryId,
}: {
  currentThread: string;
  categoryId: string;
}) {
  const { getAllThreads } = useForumContext();
  const related = useMemo(() => {
    const allThreads = getAllThreads();
    return allThreads
      .filter((t) => t.id !== currentThread && t.categoryId === categoryId)
      .slice(0, 5);
  }, [currentThread, categoryId, getAllThreads]);

  const navigate = useNavigate();

  if (related.length === 0) return null;

  return (
    <div className="hud-panel p-4 space-y-3">
      <h4 className="text-[11px] font-mono font-bold text-forum-text uppercase tracking-wider flex items-center gap-2">
        <LinkIcon size={12} className="text-forum-pink" />
        Related Threads
      </h4>
      <div className="space-y-2">
        {related.map((thread) => (
          <button
            key={thread.id}
            onClick={() => navigate(`/thread/${thread.id}`)}
            className="transition-forum w-full text-left group rounded-md border border-forum-border/20 bg-forum-bg/30 px-3 py-2 hover:border-forum-pink/20 hover:bg-forum-pink/[0.03]"
          >
            <div className="text-[10px] font-mono text-forum-text/90 group-hover:text-forum-pink line-clamp-2 leading-relaxed">
              {thread.title}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] font-mono text-forum-muted flex items-center gap-0.5">
                <MessageCircle size={7} /> {thread.replyCount}
              </span>
              <span className="text-[8px] font-mono text-forum-muted flex items-center gap-0.5">
                <Eye size={7} /> {thread.viewCount.toLocaleString()}
              </span>
              <span className="text-[8px] font-mono text-forum-muted ml-auto">
                {formatTimeAgo(thread.lastReplyAt)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Scroll to Top Button ---
function ScrollToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-6 z-30 transition-forum hud-panel h-9 w-9 flex items-center justify-center text-forum-muted hover:text-forum-pink hover:border-forum-pink/30 hover:shadow-pink-glow"
      title="Scroll to top"
    >
      <ArrowUp size={14} />
    </button>
  );
}

// --- Thread Reading Progress Bar ---
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      setProgress(scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-forum-bg/50">
      <div
        className="h-full bg-gradient-to-r from-forum-pink to-forum-pink/60 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// --- Rich Reply Toolbar ---
function ReplyToolbar({ onInsert }: { onInsert: (text: string) => void }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const commonEmojis = [
    '😀', '😂', '🤔', '👍', '👎', '🔥', '💡', '❤️', '🎉', '👀',
    '🚀', '💯', '🐛', '⚡', '🤖', '🎯', '✅', '❌', '⚠️', '💀',
    '🧠', '💻', '🔧', '📦', '🎨', '🛡️', '☕', '🌟', '😎', '🤝',
  ];

  return (
    <div className="flex items-center gap-0.5 pb-2 border-b border-forum-border/20 mb-2 flex-wrap">
      <button
        onClick={() => onInsert('**bold**')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="Bold"
      >
        <Bold size={12} />
      </button>
      <button
        onClick={() => onInsert('*italic*')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="Italic"
      >
        <Italic size={12} />
      </button>
      <button
        onClick={() => onInsert('~~strikethrough~~')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="Strikethrough"
      >
        <Strikethrough size={12} />
      </button>
      <button
        onClick={() => onInsert('## Heading')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="Heading"
      >
        <Heading size={12} />
      </button>
      <div className="w-px h-4 bg-forum-border/30 mx-0.5" />
      <button
        onClick={() => onInsert('`inline code`')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="Inline Code"
      >
        <span className="text-[9px] font-mono font-bold">{'{}'}</span>
      </button>
      <button
        onClick={() => onInsert('```\ncode\n```')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="Code Block"
      >
        <Code size={12} />
      </button>
      <button
        onClick={() => onInsert('[link text](url)')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="Link"
      >
        <LinkIcon size={12} />
      </button>
      <button
        onClick={() => onInsert('- item\n- item\n- item')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="List"
      >
        <List size={12} />
      </button>
      <div className="w-px h-4 bg-forum-border/30 mx-0.5" />
      <button
        onClick={() => onInsert('\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="Insert Table"
      >
        <Table size={12} />
      </button>
      <button
        onClick={() => onInsert('\n[spoiler]Hidden content goes here[/spoiler]\n')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="Spoiler Tag"
      >
        <EyeOff size={12} />
      </button>
      <ImageUploadButton
        onImageInsert={onInsert}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        iconSize={12}
      />
      <button
        onClick={() => onInsert('@')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="Mention"
      >
        <AtSign size={12} />
      </button>
      <button
        onClick={() => onInsert('> ')}
        className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
        title="Quote"
      >
        <Quote size={12} />
      </button>
      {/* Emoji picker */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`transition-forum rounded p-1.5 hover:bg-forum-pink/5 ${showEmojiPicker ? 'text-forum-pink bg-forum-pink/10' : 'text-forum-muted hover:text-forum-pink'}`}
          title="Emoji Picker"
        >
          <Smile size={12} />
        </button>
        {showEmojiPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
            <div className="absolute left-0 bottom-full mb-1 z-20 hud-panel w-[220px] p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-mono font-bold text-forum-muted uppercase tracking-wider">Emoji</span>
                <button onClick={() => setShowEmojiPicker(false)} className="text-forum-muted hover:text-forum-text transition-forum">
                  <X size={10} />
                </button>
              </div>
              <div className="grid grid-cols-10 gap-0.5">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onInsert(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="transition-forum rounded p-1 text-[14px] hover:bg-forum-pink/10 hover:scale-125 transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex-1" />
      <span className="text-[8px] font-mono text-forum-muted/40 hidden sm:inline">
        Markdown supported
      </span>
    </div>
  );
}

// ============================================================================
// Post Card
// ============================================================================

interface PostCardProps {
  post: PostData;
  index: number;
  isOP: boolean;
  onQuote: (author: string, content: string) => void;
  onEdit: (postId: string, newContent: string) => Promise<void>;
  currentUserId: string;
  threadAuthorId: string;
  threadId: string;
}


// ============================================================================
// Main Page
// ============================================================================

type SortType = 'date' | 'votes';

export default function ThreadDetailPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [replyText, setReplyText] = useState('');
  const [quotedPost, setQuotedPost] = useState<{ author: string; content: string } | undefined>(undefined);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const postsContainerRef = useRef<HTMLDivElement>(null);
  const replyBoxRef = useRef<HTMLTextAreaElement>(null);

  // Use ForumContext for all data and actions
  const {
    getThread,
    getCategory,
    getPostsForThread,
    unsubscribeFromThreadPosts,
    getPollForThread,
    addPost,
    editPost,
    toggleBookmark,
    isBookmarked: isBookmarkedFn,
    toggleWatch,
    isWatching: isWatchingFn,
    markThreadRead,
    forumStats,
    currentUser,
    loadingPosts,
  } = useForumContext();
  
  const { canManageThreads, canPinThreads, canLockThreads, canDeleteThreads, canFeatureThreads } = usePermissions();

  // Find the thread
  const thread = useMemo(() => {
    if (!threadId) return null;
    return getThread(threadId);
  }, [threadId, getThread]);

  const category = useMemo(() => {
    if (!thread) return null;
    return getCategory(thread.categoryId);
  }, [thread, getCategory]);

  const posts = useMemo(() => {
    if (!thread) return [];
    return getPostsForThread(thread.id);
  }, [thread, getPostsForThread]);

  const poll = useMemo(() => {
    if (!thread) return null;
    return getPollForThread(thread.id);
  }, [thread, getPollForThread]);

  // Mark thread as read when page loads
  useEffect(() => {
    if (threadId && thread?.hasUnread) {
      markThreadRead(threadId);
    }
  }, [threadId, thread?.hasUnread, markThreadRead]);

  // Clean up thread subscription when navigating away
  // Requirements: 2.6
  useEffect(() => {
    // Cleanup function runs when component unmounts or threadId changes
    return () => {
      if (threadId) {
        unsubscribeFromThreadPosts(threadId);
      }
    };
  }, [threadId, unsubscribeFromThreadPosts]);

  // Derive bookmark/watch state from context
  const isBookmarked = threadId ? isBookmarkedFn(threadId) : false;
  const isWatching = threadId ? isWatchingFn(threadId) : false;

  const isSolved = thread?.tags?.some((t) => t.toLowerCase() === 'solved');

  const handleQuote = useCallback(
    (author: string, content: string) => {
      const quoteText = `> **@${author}** wrote:\n> ${content}...\n\n`;
      setReplyText((prev) => prev + quoteText);
      setQuotedPost({ author, content: content + '...' });
      replyBoxRef.current?.focus();
      replyBoxRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    },
    []
  );

  const handlePostReply = useCallback(async () => {
    if (!replyText.trim() || !thread || isSubmittingReply) return;

    setIsSubmittingReply(true);

    // Extract the actual reply text (without the quote prefix) for the addPost call
    // The addPost function in context will format the quoted content
    const actualContent = quotedPost
      ? replyText.replace(/^(?:>.*\n)+\n?/m, '').trim() || replyText
      : replyText;

    try {
      await addPost(thread.id, actualContent, quotedPost);
      setReplyText('');
      setQuotedPost(undefined);

      // Scroll to see the new post at the bottom of the thread
      setTimeout(() => {
        if (postsContainerRef.current) {
          const lastPost = postsContainerRef.current.lastElementChild;
          lastPost?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 150);
    } catch (error) {
      console.error('Failed to post reply:', error);
      // Error is already handled by ForumContext with user-friendly message
    } finally {
      setIsSubmittingReply(false);
    }
  }, [replyText, thread, quotedPost, addPost, isSubmittingReply]);

  const handleInsertInReply = useCallback((text: string) => {
    setReplyText((prev) => prev + text);
    replyBoxRef.current?.focus();
  }, []);

  const handleEditPost = useCallback(async (postId: string, newContent: string) => {
    try {
      await editPost(postId, newContent);
    } catch (error) {
      console.error('Failed to edit post:', error);
      // Error is already handled by ForumContext
    }
  }, [editPost]);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  }, []);

  const handleReportPost = useCallback(async (postId: string, reason: string, details: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.from('content_reports').insert({
        reporter_id: currentUser.id,
        target_type: 'post',
        target_id: postId,
        reason,
        details,
        status: 'pending'
      });
      if (error) throw error;
      // Success toast is also triggered in ImprovedPostCard, but we can rely on it there or here.
      // ImprovedPostCard shows its own success toast.
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error('Failed to report post');
      throw error; // Let ImprovedPostCard know it failed
    }
  }, [currentUser]);

  const scrollToTop = useCallback(() => {
    postsContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    replyBoxRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, []);

  if (!thread || !category) {
    return (
      <div className="min-h-screen bg-forum-bg flex items-center justify-center">
        <div className="hud-panel px-10 py-12 text-center">
          <div className="text-[40px] mb-4">
            <SearchX size={40} className="text-forum-pink mx-auto" />
          </div>
          <h2 className="text-[16px] font-bold text-forum-text font-mono mb-2">
            Thread Not Found
          </h2>
          <p className="text-[12px] text-forum-muted font-mono mb-6">
            The thread you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            onClick={() => navigate('/')}
            className="transition-forum rounded bg-forum-pink px-5 py-2.5 text-[11px] font-mono font-semibold text-white hover:shadow-pink-glow active:scale-95 border border-forum-pink/50"
          >
            Back to Forums
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forum-bg">
      <ReadingProgressBar />

      <ForumHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-4 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
          <HomeIcon size={11} className="text-forum-pink" />
          <span
            onClick={() => navigate('/')}
            className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer"
          >
            Forums
          </span>
          <ChevronRight size={10} />
          <span
            onClick={() => navigate(`/category/${category.id}`)}
            className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer"
          >
            {category.name}
          </span>
          <ChevronRight size={10} />
          <span className="text-forum-pink truncate max-w-[200px]">
            {thread.title}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 space-y-4">
        {/* Thread Header */}
        <div className="hud-panel overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-forum-card to-forum-bg/50" />
            <div className="relative px-5 py-5">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {thread.isPinned && (
                  <span className="badge-shine inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-forum-pink/20 to-forum-pink/10 border border-forum-pink/40 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-forum-pink badge-glow-pink">
                    <Pin
                      size={11}
                      className="drop-shadow-[0_0_3px_rgba(255,45,146,0.6)]"
                    />
                    Pinned
                  </span>
                )}
                {thread.isLocked && (
                  <span className="badge-shine inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/35 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 badge-glow-amber">
                    <Lock
                      size={11}
                      className="drop-shadow-[0_0_3px_rgba(245,158,11,0.6)]"
                    />
                    Locked
                  </span>
                )}
                {thread.isHot && (
                  <span className="badge-shine inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-br from-orange-500/35 via-red-500/28 to-amber-500/18 border border-orange-500/65 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-orange-300 badge-glow-orange shadow-lg shadow-orange-500/35 hover:shadow-orange-500/55 transition-all duration-250">
                    <Flame
                      size={12}
                      className="animate-flame text-orange-300 drop-shadow-[0_0_5px_rgba(249,115,22,0.7)]"
                    />
                    <span className="bg-gradient-to-r from-orange-300 via-red-300 to-orange-200 bg-clip-text text-transparent font-extrabold">
                      Hot
                    </span>
                  </span>
                )}
                {isSolved && (
                  <span className="badge-shine inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 badge-glow-emerald">
                    <CheckCircle2
                      size={11}
                      className="drop-shadow-[0_0_3px_rgba(52,211,153,0.6)]"
                    />
                    Solved
                  </span>
                )}
                {thread.replyCount > 100 && (
                  <span className="badge-shine inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-cyan-500/15 to-blue-500/10 border border-cyan-500/35 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 badge-glow-cyan">
                    <TrendingUp
                      size={11}
                      className="drop-shadow-[0_0_3px_rgba(34,211,238,0.6)]"
                    />
                    Popular
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-[20px] font-bold text-forum-text font-mono leading-tight mb-3">
                {thread.title}
              </h1>

              {/* Thread meta */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <img
                    src={thread.author.avatar}
                    alt={thread.author.username}
                    className="h-7 w-7 rounded-md border border-forum-border object-cover"
                  />
                  <span className="text-[11px] font-mono font-semibold text-forum-text">
                    {thread.author.username}
                  </span>
                  {thread.author.rank && (
                    <span
                      className={`badge-shine inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-[2px] text-[8px] font-mono font-bold uppercase tracking-wider ${getRankColor(thread.author.rank)}`}
                    >
                      {getRankIcon(thread.author.rank)}
                      {thread.author.rank}
                    </span>
                  )}
                  <RoleBadge role={(thread.author.role as UserRole) || 'member'} size="sm" />
                </div>
                <span className="text-forum-muted/30">·</span>
                <span className="text-[10px] text-forum-muted font-mono flex items-center gap-1">
                  <Clock size={9} />
                  {formatDate(thread.createdAt)}
                </span>
              </div>

              {/* Stats bar */}
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
                  <Eye size={11} className="text-forum-muted/60" />
                  <span className="font-semibold text-forum-text">
                    {thread.viewCount.toLocaleString()}
                  </span>{' '}
                  views
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
                  <MessageCircle size={11} className="text-forum-muted/60" />
                  <span className="font-semibold text-forum-text">
                    {thread.replyCount}
                  </span>{' '}
                  replies
                </div>

                {/* Tags */}
                {thread.tags && thread.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {thread.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-sm border border-forum-pink/15 bg-forum-pink/[0.05] px-2 py-0.5 text-[9px] font-mono font-medium text-forum-pink/80 hover:bg-forum-pink/10 hover:text-forum-pink transition-forum cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 ml-auto flex-wrap">
                  {/* Watch/Subscribe */}
                  <button
                    onClick={() => threadId && toggleWatch(threadId)}
                    className={`transition-forum flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-mono border ${isWatching
                      ? 'text-forum-pink bg-forum-pink/10 border-forum-pink/25'
                      : 'text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5 border-forum-border/30'
                      }`}
                  >
                    {isWatching ? <BellOff size={11} /> : <Bell size={11} />}
                    {isWatching ? 'Watching' : 'Watch'}
                  </button>

                  {/* Bookmark */}
                  <button
                    onClick={() => threadId && toggleBookmark(threadId)}
                    className={`transition-forum flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-mono border ${isBookmarked
                      ? 'text-forum-pink bg-forum-pink/10 border-forum-pink/25'
                      : 'text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5 border-forum-border/30'
                      }`}
                  >
                    <Bookmark
                      size={11}
                      fill={isBookmarked ? 'currentColor' : 'none'}
                    />
                    {isBookmarked ? 'Saved' : 'Save'}
                  </button>

                  {/* Share */}
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="transition-forum flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-mono text-forum-muted border border-forum-border/30 hover:text-forum-pink hover:bg-forum-pink/5"
                  >
                    <Share2 size={11} />
                    Share
                  </button>
                </div>
              </div>

              {/* Mod actions toolbar */}
              {canManageThreads && (
                <div className="mt-4 flex items-center gap-2 flex-wrap p-3 bg-forum-card/80 rounded-md border border-forum-pink/20 shadow-inner">
                  <span className="text-[10px] font-mono font-bold text-forum-pink uppercase tracking-wider mr-2">
                    Staff Actions:
                  </span>
                  {canPinThreads && (
                    <button
                      onClick={async () => {
                        const { error } = await supabase.from('threads').update({ is_pinned: !thread.isPinned }).eq('id', thread.id);
                        if (!error) toast.success(thread.isPinned ? 'Thread unpinned' : 'Thread pinned');
                      }}
                      className={`transition-forum flex items-center gap-1 rounded bg-forum-bg/50 px-2 py-1.5 text-[10px] font-mono border ${thread.isPinned ? 'text-forum-pink border-forum-pink/40 shadow-pink-glow' : 'text-forum-muted border-forum-border/30 hover:border-forum-pink/40 hover:text-forum-pink'}`}
                    >
                      <Pin size={11} className={thread.isPinned ? "fill-forum-pink" : ""} /> {thread.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                  )}
                  {canLockThreads && (
                    <button
                      onClick={async () => {
                        const { error } = await supabase.from('threads').update({ is_locked: !thread.isLocked }).eq('id', thread.id);
                        if (!error) toast.success(thread.isLocked ? 'Thread unlocked' : 'Thread locked');
                      }}
                      className={`transition-forum flex items-center gap-1 rounded bg-forum-bg/50 px-2 py-1.5 text-[10px] font-mono border ${thread.isLocked ? 'text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'text-forum-muted border-forum-border/30 hover:border-amber-500/40 hover:text-amber-400'}`}
                    >
                      <Lock size={11} className={thread.isLocked ? "fill-amber-400" : ""} /> {thread.isLocked ? 'Unlock' : 'Lock'}
                    </button>
                  )}
                  {canFeatureThreads && (
                    <button
                      onClick={async () => {
                        const { error } = await supabase.from('threads').update({ is_hot: !thread.isHot }).eq('id', thread.id);
                        if (!error) toast.success(thread.isHot ? 'Thread unfeatured' : 'Thread featured');
                      }}
                      className={`transition-forum flex items-center gap-1 rounded bg-forum-bg/50 px-2 py-1.5 text-[10px] font-mono border ${thread.isHot ? 'text-orange-400 border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.3)]' : 'text-forum-muted border-forum-border/30 hover:border-orange-500/40 hover:text-orange-400'}`}
                    >
                      <Flame size={11} className={thread.isHot ? "fill-orange-400" : ""} /> {thread.isHot ? 'Unfeature' : 'Feature'}
                    </button>
                  )}
                  {canDeleteThreads && (
                    <button
                      onClick={async () => {
                        if (confirm('Critical Action: Are you sure you want to delete this thread permanently?')) {
                          const { error } = await supabase.from('threads').delete().eq('id', thread.id);
                          if (!error) {
                            toast.success('Thread deleted');
                            navigate(`/category/${category.id}`);
                          } else {
                            toast.error('Failed to delete thread');
                          }
                        }
                      }}
                      className="transition-forum flex items-center gap-1 rounded bg-forum-bg/50 px-2 py-1.5 text-[10px] font-mono text-forum-muted border border-forum-border/30 hover:text-red-400 hover:border-red-500/40"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-forum-pink/40 to-transparent" />
          </div>
        </div>

        {/* Poll (if exists) */}
        {poll && thread && <ThreadPoll poll={poll} threadId={thread.id} />}

        {/* Thread Navigation */}
        <ThreadNavBar
          postCount={posts.length}
          onScrollToTop={scrollToTop}
          onScrollToBottom={scrollToBottom}
        />

        <div className="flex gap-6">
          {/* Main content */}
          <div
            ref={postsContainerRef}
            className="flex-1 min-w-0 space-y-3"
          >
            {/* Posts */}
            {threadId && loadingPosts[threadId] ? (
              <div className="hud-panel p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                <p className="mt-4 text-gray-400">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="hud-panel p-8 text-center text-gray-400">
                No posts yet. Be the first to reply!
              </div>
            ) : (
              <>
                {/* 
                  ------------------------------------------
                  NEW SORTING & WATCH TOOLBAR 
                  ------------------------------------------
                */}
                <div className="flex items-center justify-between bg-forum-card/60 border border-forum-border/30 rounded-t-md px-4 py-2 mt-4 backdrop-blur-sm -mb-2">
                  <div className="flex gap-4 text-[13px] font-mono">
                    <button
                      onClick={() => setSortBy('date')}
                      className={`pb-1 border-b-2 transition-colors ${sortBy === 'date' ? 'border-forum-pink text-forum-text' : 'border-transparent text-forum-muted hover:text-forum-text/80'
                        }`}
                    >
                      Sort by date
                    </button>
                    <button
                      onClick={() => setSortBy('votes')}
                      className={`pb-1 border-b-2 transition-colors ${sortBy === 'votes' ? 'border-forum-pink text-forum-text' : 'border-transparent text-forum-muted hover:text-forum-text/80'
                        }`}
                    >
                      Sort by votes
                    </button>
                  </div>
                  <button
                    onClick={() => threadId && toggleWatch(threadId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono rounded text-forum-muted hover:text-forum-text hover:bg-forum-card transition-colors border border-forum-border/30"
                  >
                    {isWatching ? (
                      <>
                        <BellOff size={11} className="text-forum-pink" />
                        <span>Unwatch</span>
                      </>
                    ) : (
                      <>
                        <Bell size={11} />
                        <span>Watch</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sorted Posts List */}
                {[...posts]
                  .sort((a, b) => {
                    if (sortBy === 'date') {
                      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    } else {
                      // Custom score sorting logic based on upvotes - downvotes
                      const aScore = a.upvotes - a.downvotes;
                      const bScore = b.upvotes - b.downvotes;
                      return bScore - aScore;
                    }
                  })
                  .map((post, idx) => (
                    <ImprovedPostCard
                      key={post.id}
                      post={post}
                      index={idx}
                      isOP={post.author.id === thread?.author.id}
                      onQuote={handleQuote}
                      onEdit={handleEditPost}
                      onDelete={handleDeletePost}
                      onReport={handleReportPost}
                      currentUserId={currentUser.id}
                      threadAuthorId={thread?.author.id || ''}
                      threadId={thread?.id || ''}
                    />
                  ))}
              </>
            )}

            {/* Post Navigation Bottom */}
            <ThreadNavBar
              postCount={posts.length}
              onScrollToTop={scrollToTop}
              onScrollToBottom={scrollToBottom}
            />

            {/* Reply box */}
            {!thread.isLocked ? (
              <div className="hud-panel overflow-hidden" id="reply-box">
                <div className="px-4 py-2 border-b border-forum-border/20 bg-forum-card-alt/30">
                  <span className="text-[11px] font-mono font-bold text-forum-text flex items-center gap-2">
                    <Reply size={12} className="text-forum-pink" />
                    Post a Reply
                  </span>
                </div>
                <div className="p-4">
                  {/* Rich editor toolbar */}
                  <ReplyToolbar onInsert={handleInsertInReply} />

                  {/* Quote preview */}
                  {replyText.startsWith('>') && (
                    <div className="mb-2 rounded-md border-l-2 border-forum-pink/30 bg-forum-bg/50 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono text-forum-muted flex items-center gap-1">
                          <Quote size={8} className="text-forum-pink/60" />{' '}
                          Quoting
                        </span>
                        <button
                          onClick={() => { setReplyText(''); setQuotedPost(undefined); }}
                          className="text-forum-muted hover:text-forum-text transition-forum"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    </div>
                  )}

                  <textarea
                    ref={replyBoxRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply... (Markdown supported)"
                    className="w-full h-36 bg-forum-bg border border-forum-border/30 rounded-md px-3 py-2.5 text-[12px] font-mono text-forum-text placeholder:text-forum-muted/40 focus:outline-none focus:border-forum-pink/40 focus:ring-1 focus:ring-forum-pink/20 transition-forum resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-forum-muted/50">
                        Supports Markdown, @mentions, and code blocks
                      </span>
                      <span className="text-[9px] font-mono text-forum-muted/30">
                        {replyText.length} chars
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {replyText.trim() && (
                        <button
                          onClick={() => { setReplyText(''); setQuotedPost(undefined); }}
                          className="transition-forum rounded-md px-3 py-2 text-[10px] font-mono text-forum-muted border border-forum-border/30 hover:text-forum-text hover:border-forum-border/50"
                        >
                          Discard
                        </button>
                      )}
                      <button
                        onClick={handlePostReply}
                        className="transition-forum rounded-md bg-forum-pink px-4 py-2 text-[11px] font-mono font-semibold text-white hover:shadow-pink-glow active:scale-95 border border-forum-pink/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={!replyText.trim() || isSubmittingReply}
                      >
                        {isSubmittingReply ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Posting...
                          </>
                        ) : (
                          'Post Reply'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hud-panel px-4 py-3 flex items-center gap-3 border-amber-500/20 bg-amber-500/[0.04]">
                <Lock size={14} className="text-amber-400 flex-shrink-0" />
                <span className="text-[11px] font-mono text-amber-400">
                  This thread is locked. No new replies can be posted.
                </span>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden w-[280px] flex-shrink-0 space-y-4 lg:block">
            <UserProfileMiniCard user={currentUser} />

            {/* Thread Info */}
            <div className="hud-panel p-4 space-y-3">
              <h4 className="text-[11px] font-mono font-bold text-forum-text uppercase tracking-wider flex items-center gap-2">
                <Award size={12} className="text-forum-pink" />
                Thread Info
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">
                    Created
                  </span>
                  <span className="text-[10px] font-mono text-forum-text">
                    {formatTimeAgo(thread.createdAt)}
                  </span>
                </div>
                <div className="h-[1px] bg-forum-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">
                    Last Reply
                  </span>
                  <span className="text-[10px] font-mono text-forum-text">
                    {formatTimeAgo(thread.lastReplyAt)}
                  </span>
                </div>
                <div className="h-[1px] bg-forum-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">
                    Category
                  </span>
                  <span
                    onClick={() => navigate(`/category/${category.id}`)}
                    className="text-[10px] font-mono text-forum-pink cursor-pointer hover:underline"
                  >
                    {category.name.split('—')[0].trim()}
                  </span>
                </div>
                <div className="h-[1px] bg-forum-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">
                    Watching
                  </span>
                  <span
                    className={`text-[10px] font-mono ${isWatching ? 'text-forum-pink' : 'text-forum-muted'}`}
                  >
                    {isWatching ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="h-[1px] bg-forum-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">
                    Bookmarked
                  </span>
                  <span
                    className={`text-[10px] font-mono ${isBookmarked ? 'text-forum-pink' : 'text-forum-muted'}`}
                  >
                    {isBookmarked ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="hud-panel p-4 space-y-3">
              <h4 className="text-[11px] font-mono font-bold text-forum-text uppercase tracking-wider flex items-center gap-2">
                <MessageCircle size={12} className="text-forum-pink" />
                Participants (
                {
                  Array.from(new Set(posts.map((p) => p.author.id))).length
                }
                )
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(posts.map((p) => p.author.id))).map(
                  (authorId) => {
                    const author = posts.find(
                      (p) => p.author.id === authorId
                    )?.author;
                    if (!author) return null;
                    const postsByAuthor = posts.filter(
                      (p) => p.author.id === authorId
                    ).length;
                    return (
                      <div
                        key={authorId}
                        className="flex items-center gap-1.5 rounded-md bg-forum-bg/50 border border-forum-border/30 px-2 py-1 group hover:border-forum-pink/20 transition-forum"
                      >
                        <img
                          src={author.avatar}
                          alt={author.username}
                          className="h-5 w-5 rounded object-cover border border-forum-border"
                        />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono text-forum-text group-hover:text-forum-pink transition-forum">
                            {author.username}
                          </span>
                          <span className="text-[7px] font-mono text-forum-muted">
                            {postsByAuthor} post
                            {postsByAuthor !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Thread Tags */}
            {thread.tags && thread.tags.length > 0 && (
              <div className="hud-panel p-4 space-y-3">
                <h4 className="text-[11px] font-mono font-bold text-forum-text uppercase tracking-wider flex items-center gap-2">
                  <Hash size={12} className="text-forum-pink" />
                  Thread Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {thread.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-sm border border-forum-pink/15 bg-forum-pink/[0.05] px-2 py-1 text-[9px] font-mono font-medium text-forum-pink/80 hover:bg-forum-pink/10 hover:text-forum-pink transition-forum cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Threads */}
            <RelatedThreads
              currentThread={thread.id}
              categoryId={thread.categoryId}
            />

            <SidebarStatsPanel stats={forumStats} />
            <PopularTags />
            <OnlineUsers />
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] overflow-y-auto border-l border-forum-border bg-forum-card p-4 space-y-4">
            <UserProfileMiniCard user={currentUser} />
            <SidebarStatsPanel stats={forumStats} />
            <PopularTags />
            <OnlineUsers />
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setIsModalOpen(true)} />

      {/* Scroll to Top */}
      <ScrollToTopButton />

      {/* New Thread Modal */}
      <NewThreadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        threadTitle={thread.title}
        threadId={thread.id}
      />

      <MobileBottomNav />
    </div>
  );
}
