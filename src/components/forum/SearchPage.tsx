import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    MessageCircle,
    Eye,
    Clock,
    User,
    FileText,
    Filter,
    ArrowUpDown,
    ChevronRight,
    Home as HomeIcon,
    Loader2,
    Inbox,
} from 'lucide-react';
import ForumHeader from '@/components/forum/ForumHeader';
import MobileBottomNav from '@/components/forum/MobileBottomNav';
import { supabase } from '@/lib/supabase';

interface SearchResult {
    id: string;
    type: 'thread' | 'post' | 'user';
    title: string;
    excerpt: string;
    author?: string;
    authorAvatar?: string;
    categoryName?: string;
    replyCount?: number;
    viewCount?: number;
    createdAt: string;
    link: string;
}

export default function SearchPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const initialQuery = searchParams.get('q') || '';

    const [searchQuery, setSearchQuery] = useState('');
    const [pageSearchQuery, setPageSearchQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState<'threads' | 'posts' | 'users'>('threads');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'views'>('relevance');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialQuery) {
            setPageSearchQuery(initialQuery);
            performSearch(initialQuery, activeTab);
        }
    }, []);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const performSearch = async (query: string, tab: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setIsLoading(true);

        try {
            const searchResults: SearchResult[] = [];

            if (tab === 'threads' || tab === 'all') {
                const { data: threads } = await supabase
                    .from('threads')
                    .select(`
            id, title, excerpt, created_at, reply_count, view_count,
            author:forum_users!threads_author_id_fkey(username, avatar),
            category:categories!threads_category_id_fkey(name)
          `)
                    .ilike('title', `%${query}%`)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (threads) {
                    for (const t of threads) {
                        const author = Array.isArray(t.author) ? t.author[0] : t.author;
                        const category = Array.isArray(t.category) ? t.category[0] : t.category;
                        searchResults.push({
                            id: t.id,
                            type: 'thread',
                            title: t.title,
                            excerpt: t.excerpt || '',
                            author: (author as any)?.username || 'Unknown',
                            authorAvatar: (author as any)?.avatar,
                            categoryName: (category as any)?.name,
                            replyCount: t.reply_count,
                            viewCount: t.view_count,
                            createdAt: t.created_at,
                            link: `/thread/${t.id}`,
                        });
                    }
                }
            }

            if (tab === 'posts') {
                const { data: posts } = await supabase
                    .from('posts')
                    .select(`
            id, content, created_at, thread_id,
            author:forum_users!posts_author_id_fkey(username, avatar),
            thread:threads!posts_thread_id_fkey(title)
          `)
                    .ilike('content', `%${query}%`)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (posts) {
                    for (const p of posts) {
                        const author = Array.isArray(p.author) ? p.author[0] : p.author;
                        const thread = Array.isArray(p.thread) ? p.thread[0] : p.thread;
                        searchResults.push({
                            id: p.id,
                            type: 'post',
                            title: (thread as any)?.title || 'Post',
                            excerpt: p.content.substring(0, 200),
                            author: (author as any)?.username || 'Unknown',
                            authorAvatar: (author as any)?.avatar,
                            createdAt: p.created_at,
                            link: `/thread/${p.thread_id}#${p.id}`,
                        });
                    }
                }
            }

            if (tab === 'users') {
                const { data: users } = await supabase
                    .from('forum_users')
                    .select('id, username, avatar, reputation, post_count, join_date')
                    .ilike('username', `%${query}%`)
                    .order('reputation', { ascending: false })
                    .limit(20);

                if (users) {
                    for (const u of users) {
                        searchResults.push({
                            id: u.id,
                            type: 'user',
                            title: u.username,
                            excerpt: `${u.post_count} posts · ${u.reputation} reputation`,
                            authorAvatar: u.avatar,
                            createdAt: u.join_date,
                            link: `/user/${u.id}`,
                        });
                    }
                }
            }

            if (sortBy === 'date') {
                searchResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            } else if (sortBy === 'views') {
                searchResults.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
            }

            setResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (pageSearchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(pageSearchQuery)}`);
            performSearch(pageSearchQuery, activeTab);
        }
    };

    const handleTabChange = (tab: 'threads' | 'posts' | 'users') => {
        setActiveTab(tab);
        if (pageSearchQuery.trim()) {
            performSearch(pageSearchQuery, tab);
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const tabs = [
        { key: 'threads' as const, label: 'Threads', icon: FileText },
        { key: 'posts' as const, label: 'Posts', icon: MessageCircle },
        { key: 'users' as const, label: 'Users', icon: User },
    ];

    return (
        <div className="min-h-screen bg-forum-bg pb-20 lg:pb-0">
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
                        className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        Forums
                    </span>
                    <ChevronRight size={10} />
                    <span className="text-forum-muted">Search</span>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 py-4 lg:px-6 space-y-4">
                {/* Search Header */}
                <div className="hud-panel p-6">
                    <h1 className="text-[18px] font-mono font-bold text-forum-text mb-4 flex items-center gap-2">
                        <Search size={18} className="text-forum-pink" />
                        Search Forum
                    </h1>
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-forum-muted" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search threads, posts, users..."
                            value={pageSearchQuery}
                            onChange={(e) => setPageSearchQuery(e.target.value)}
                            className="transition-forum w-full rounded-md border border-forum-border bg-forum-bg py-3 pl-11 pr-4 text-[13px] font-mono text-forum-text placeholder-forum-muted outline-none focus:border-forum-pink focus:shadow-pink-glow focus:ring-1 focus:ring-forum-pink/30"
                        />
                    </form>
                </div>

                {/* Tabs + Filters */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`transition-forum flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-mono font-medium ${activeTab === tab.key
                                        ? 'bg-forum-pink/10 text-forum-pink border border-forum-pink/20'
                                        : 'text-forum-muted hover:text-forum-text hover:bg-forum-hover'
                                    }`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() =>
                                setSortBy((prev) =>
                                    prev === 'relevance' ? 'date' : prev === 'date' ? 'views' : 'relevance'
                                )
                            }
                            className="transition-forum flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono text-forum-muted hover:text-forum-pink border border-forum-border/30 hover:border-forum-pink/30"
                        >
                            <ArrowUpDown size={10} />
                            Sort: {sortBy}
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-2">
                    {isLoading ? (
                        <div className="hud-panel flex items-center justify-center py-16">
                            <Loader2 size={24} className="text-forum-pink animate-spin" />
                            <span className="ml-3 text-[12px] font-mono text-forum-muted">Searching...</span>
                        </div>
                    ) : results.length > 0 ? (
                        results.map((result) => (
                            <button
                                key={result.id}
                                onClick={() => navigate(result.link)}
                                className="transition-forum w-full text-left hud-panel p-4 hover:border-forum-pink/30 hover:bg-forum-pink/[0.02] group"
                            >
                                <div className="flex items-start gap-3">
                                    {result.type === 'user' && result.authorAvatar ? (
                                        <img
                                            src={result.authorAvatar}
                                            alt={result.title}
                                            className="h-10 w-10 rounded-md border border-forum-border object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-md border border-forum-border/30 bg-forum-bg flex items-center justify-center flex-shrink-0">
                                            {result.type === 'thread' ? (
                                                <FileText size={16} className="text-forum-pink/50" />
                                            ) : (
                                                <MessageCircle size={16} className="text-forum-pink/50" />
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[7px] font-mono font-bold uppercase tracking-wider px-1.5 py-[1px] rounded-sm border border-forum-border/30 text-forum-muted">
                                                {result.type}
                                            </span>
                                            {result.categoryName && (
                                                <span className="text-[8px] font-mono text-forum-pink/60">
                                                    {result.categoryName}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-[13px] font-mono font-semibold text-forum-text group-hover:text-forum-pink truncate">
                                            {result.title}
                                        </h3>
                                        {result.excerpt && (
                                            <p className="text-[11px] font-mono text-forum-muted line-clamp-2 mt-1">
                                                {result.excerpt}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-forum-muted">
                                            {result.author && (
                                                <span className="flex items-center gap-1">
                                                    <User size={9} /> {result.author}
                                                </span>
                                            )}
                                            {result.replyCount !== undefined && (
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle size={9} /> {result.replyCount}
                                                </span>
                                            )}
                                            {result.viewCount !== undefined && (
                                                <span className="flex items-center gap-1">
                                                    <Eye size={9} /> {result.viewCount?.toLocaleString()}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Clock size={9} /> {formatTimeAgo(result.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : pageSearchQuery.trim() ? (
                        <div className="hud-panel flex flex-col items-center justify-center py-16">
                            <Inbox size={40} className="text-forum-pink/30 mb-3" />
                            <h3 className="text-[13px] font-bold text-forum-text font-mono mb-1">
                                No results found
                            </h3>
                            <p className="text-[11px] text-forum-muted font-mono">
                                Try a different search query or switch tabs
                            </p>
                        </div>
                    ) : (
                        <div className="hud-panel flex flex-col items-center justify-center py-16">
                            <Search size={40} className="text-forum-pink/20 mb-3" />
                            <h3 className="text-[13px] font-bold text-forum-text font-mono mb-1">
                                Search the forum
                            </h3>
                            <p className="text-[11px] text-forum-muted font-mono">
                                Enter a query above to search threads, posts, and users
                            </p>
                        </div>
                    )}
                </div>

                {/* Result count */}
                {!isLoading && results.length > 0 && (
                    <div className="text-[10px] font-mono text-forum-muted text-center py-2">
                        Showing {results.length} results for "{pageSearchQuery}"
                    </div>
                )}
            </div>

            <MobileBottomNav />
        </div>
    );
}
