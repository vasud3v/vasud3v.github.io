import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    FileText,
    User,
    Clock,
    X,
    ArrowRight,
    Loader2,
    Trash2,
} from 'lucide-react';
import type { QuickSearchResult } from '@/hooks/useSearch';

interface SearchDropdownProps {
    isOpen: boolean;
    query: string;
    results: QuickSearchResult[];
    isLoading: boolean;
    recentSearches: string[];
    onClose: () => void;
    onSelectResult: (link: string) => void;
    onRecentClick: (term: string) => void;
    onRemoveRecent: (term: string) => void;
    onClearRecent: () => void;
    onViewAll: () => void;
    onActiveIndexChange?: (index: number) => void;
}

export default function SearchDropdown({
    isOpen,
    query,
    results,
    isLoading,
    recentSearches,
    onClose,
    onSelectResult,
    onRecentClick,
    onRemoveRecent,
    onClearRecent,
    onViewAll,
    onActiveIndexChange,
}: SearchDropdownProps) {
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Build a flat list of selectable items for keyboard navigation
    const selectableItems = useMemo(() => {
        const items: { type: 'result' | 'recent' | 'viewAll'; value: string }[] = [];
        if (!query.trim()) {
            recentSearches.forEach((s) => items.push({ type: 'recent', value: s }));
        } else {
            results.forEach((r) => items.push({ type: 'result', value: r.link }));
            if (results.length > 0) {
                items.push({ type: 'viewAll', value: '' });
            }
        }
        return items;
    }, [query, results, recentSearches]);

    // Reset active index when results/query change
    useEffect(() => {
        setActiveIndex(-1);
        onActiveIndexChange?.(-1);
    }, [query, results.length]);

    // Keyboard handler (called from parent's onKeyDown)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => {
                    const next = prev < selectableItems.length - 1 ? prev + 1 : 0;
                    onActiveIndexChange?.(next);
                    return next;
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => {
                    const next = prev > 0 ? prev - 1 : selectableItems.length - 1;
                    onActiveIndexChange?.(next);
                    return next;
                });
            } else if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault();
                const item = selectableItems[activeIndex];
                if (item.type === 'result') {
                    onSelectResult(item.value);
                } else if (item.type === 'recent') {
                    onRecentClick(item.value);
                } else if (item.type === 'viewAll') {
                    onViewAll();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeIndex, selectableItems, onClose, onSelectResult, onRecentClick, onViewAll]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Use a short delay so the focus event on the input doesn't immediately trigger close
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClick);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClick);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const threads = results.filter((r) => r.type === 'thread');
    const users = results.filter((r) => r.type === 'user');

    const formatTimeAgo = (dateStr?: string) => {
        if (!dateStr) return '';
        const time = new Date(dateStr).getTime();
        if (isNaN(time)) return '';
        const diff = Date.now() - time;
        if (diff < 0) return 'now';
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    const showRecent = !query.trim() && recentSearches.length > 0;
    const showResults = query.trim() && !isLoading && results.length > 0;
    const showEmpty = query.trim() && !isLoading && results.length === 0;
    const showLoading = query.trim() && isLoading;

    let flatIndex = -1;

    return (
        <div ref={containerRef}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-0 right-0 top-full mt-1.5 z-[100] rounded-lg border border-forum-border bg-forum-card/98 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden"
                    >
                        {/* Recent Searches */}
                        {showRecent && (
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-forum-muted flex items-center gap-1.5">
                                        <Clock size={10} className="text-forum-pink/60" />
                                        Recent Searches
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClearRecent();
                                        }}
                                        className="text-[8px] font-mono text-forum-muted hover:text-forum-pink transition-forum flex items-center gap-1"
                                    >
                                        <Trash2 size={8} />
                                        Clear
                                    </button>
                                </div>
                                <div className="space-y-0.5">
                                    {recentSearches.map((term) => {
                                        flatIndex++;
                                        const idx = flatIndex;
                                        return (
                                            <div
                                                key={term}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => onRecentClick(term)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') onRecentClick(term); }}
                                                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-forum group cursor-pointer ${activeIndex === idx
                                                    ? 'bg-forum-pink/10 text-forum-pink'
                                                    : 'text-forum-text hover:bg-forum-hover'
                                                    }`}
                                            >
                                                <Clock size={12} className="text-forum-muted flex-shrink-0" />
                                                <span className="text-[12px] font-mono truncate flex-1">{term}</span>
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveRecent(term);
                                                    }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRemoveRecent(term); } }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-400 cursor-pointer"
                                                >
                                                    <X size={10} />
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Loading */}
                        {showLoading && (
                            <div className="flex items-center justify-center py-8 gap-2">
                                <Loader2 size={16} className="text-forum-pink animate-spin" />
                                <span className="text-[11px] font-mono text-forum-muted">Searching...</span>
                            </div>
                        )}

                        {/* Results */}
                        {showResults && (
                            <div className="p-2 max-h-[380px] overflow-y-auto">
                                {/* Threads */}
                                {threads.length > 0 && (
                                    <div className="mb-1">
                                        <div className="px-2 py-1.5">
                                            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-forum-muted flex items-center gap-1.5">
                                                <FileText size={9} className="text-forum-pink/60" />
                                                Threads
                                            </span>
                                        </div>
                                        {threads.map((result) => {
                                            flatIndex++;
                                            const idx = flatIndex;
                                            return (
                                                <button
                                                    key={result.id}
                                                    onClick={() => onSelectResult(result.link)}
                                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-forum ${activeIndex === idx
                                                        ? 'bg-forum-pink/10'
                                                        : 'hover:bg-forum-hover'
                                                        }`}
                                                >
                                                    {result.avatar ? (
                                                        <img
                                                            src={result.avatar}
                                                            alt=""
                                                            className="h-7 w-7 rounded object-cover border border-forum-border/50 flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="h-7 w-7 rounded border border-forum-border/30 bg-forum-bg flex items-center justify-center flex-shrink-0">
                                                            <FileText size={12} className="text-forum-pink/40" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`text-[12px] font-mono font-medium truncate ${activeIndex === idx ? 'text-forum-pink' : 'text-forum-text'
                                                                }`}>
                                                                {result.title}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {result.categoryName && (
                                                                <span className="text-[8px] font-mono text-forum-pink/60 bg-forum-pink/5 px-1.5 py-[1px] rounded">
                                                                    {result.categoryName}
                                                                </span>
                                                            )}
                                                            <span className="text-[9px] font-mono text-forum-muted">
                                                                {result.subtitle}
                                                            </span>
                                                            {result.createdAt && (
                                                                <span className="text-[9px] font-mono text-forum-muted">
                                                                    · {formatTimeAgo(result.createdAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Users */}
                                {users.length > 0 && (
                                    <div className="mb-1">
                                        <div className="px-2 py-1.5">
                                            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-forum-muted flex items-center gap-1.5">
                                                <User size={9} className="text-forum-pink/60" />
                                                Users
                                            </span>
                                        </div>
                                        {users.map((result) => {
                                            flatIndex++;
                                            const idx = flatIndex;
                                            return (
                                                <button
                                                    key={result.id}
                                                    onClick={() => onSelectResult(result.link)}
                                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-forum ${activeIndex === idx
                                                        ? 'bg-forum-pink/10'
                                                        : 'hover:bg-forum-hover'
                                                        }`}
                                                >
                                                    {result.avatar ? (
                                                        <img
                                                            src={result.avatar}
                                                            alt=""
                                                            className="h-7 w-7 rounded-md object-cover border border-forum-border/50 flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="h-7 w-7 rounded-md border border-forum-border/30 bg-forum-bg flex items-center justify-center flex-shrink-0">
                                                            <User size={12} className="text-forum-pink/40" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <span className={`text-[12px] font-mono font-medium ${activeIndex === idx ? 'text-forum-pink' : 'text-forum-text'
                                                            }`}>
                                                            {result.title}
                                                        </span>
                                                        <div className="text-[9px] font-mono text-forum-muted mt-0.5">
                                                            {result.subtitle}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* View All */}
                                {(() => {
                                    flatIndex++;
                                    const idx = flatIndex;
                                    return (
                                        <button
                                            onClick={onViewAll}
                                            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 mt-1 rounded-md text-[11px] font-mono font-medium transition-forum border border-forum-border/30 ${activeIndex === idx
                                                ? 'bg-forum-pink/10 text-forum-pink border-forum-pink/20'
                                                : 'text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5 hover:border-forum-pink/20'
                                                }`}
                                        >
                                            View all results
                                            <ArrowRight size={11} />
                                        </button>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Empty state */}
                        {showEmpty && (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Search size={20} className="text-forum-pink/20 mb-2" />
                                <span className="text-[11px] font-mono text-forum-muted">No results found</span>
                            </div>
                        )}

                        {/* Nothing-yet state (empty query, no recents) */}
                        {!query.trim() && recentSearches.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Search size={20} className="text-forum-pink/20 mb-2" />
                                <span className="text-[11px] font-mono text-forum-muted">Start typing to search...</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
