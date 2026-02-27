import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  ChevronRight,
  MessageCircle,
  Eye,
  Link as LinkIcon,
  SearchX,
  Award,
  Hash,
  Smile,
} from 'lucide-react';
import ForumHeader from '@/components/forum/ForumHeader';
import ThreadedPostList from '@/components/forum/thread/ThreadedPostList';
import PostSkeleton from '@/components/forum/thread/PostSkeleton';
import MobileBottomNav from '@/components/forum/MobileBottomNav';
import SidebarStatsPanel from '@/components/forum/SidebarStatsPanel';
import OnlineUsers from '@/components/forum/OnlineUsers';
import PopularTags from '@/components/forum/PopularTags';
import FloatingActionButton from '@/components/forum/FloatingActionButton';
import NewThreadModal from '@/components/forum/NewThreadModal';
import { useForumContext } from '@/context/ForumContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/components/forum/Toast';
import { formatTimeAgo } from '@/lib/forumUtils';
import { REACTION_EMOJIS } from '@/lib/forumConstants';
import { supabase } from '@/lib/supabase';

// Sub-components
import ThreadHeader from '@/components/forum/thread/ThreadHeader';
import ThreadNavigation from '@/components/forum/thread/ThreadNavigation';
import ThreadPoll from '@/components/forum/thread/ThreadPoll';
import PostSortingBar from '@/components/forum/thread/PostSortingBar';
import ReplyEditor from '@/components/forum/thread/ReplyEditor';
import ShareModal from '@/components/forum/thread/ShareModal';
import ModToolbar from '@/components/forum/thread/ModToolbar';
import { ReadingProgressBar, ScrollToTopButton } from '@/components/forum/thread/ThreadWidgets';

// ============================================================================
// Sub-Components (kept inline for simplicity)
// ============================================================================

function ReactionsBar({ reactions: initialReactions }: { reactions: { emoji: string; label: string; count: number; reacted: boolean }[] }) {
  const [reactions, setReactions] = useState(initialReactions);
  const [showPicker, setShowPicker] = useState(false);

  const toggleReaction = (emoji: string, label: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        if (existing.reacted) {
          return existing.count <= 1
            ? prev.filter((r) => r.emoji !== emoji)
            : prev.map((r) => r.emoji === emoji ? { ...r, count: r.count - 1, reacted: false } : r);
        }
        return prev.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r);
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
            {REACTION_EMOJIS.map((r) => (
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

function RelatedThreads({ currentThread, categoryId }: { currentThread: string; categoryId: string }) {
  const { getAllThreads } = useForumContext();
  const navigate = useNavigate();
  const related = useMemo(() => {
    const allThreads = getAllThreads();
    return allThreads.filter((t) => t.id !== currentThread && t.categoryId === categoryId).slice(0, 5);
  }, [currentThread, categoryId, getAllThreads]);

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

// ============================================================================
// Main Page Component
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
  const [activeReplyFormId, setActiveReplyFormId] = useState<string | null>(null);
  const [inlineReplySubmitting, setInlineReplySubmitting] = useState(false);
  const postsContainerRef = useRef<HTMLDivElement>(null);
  const replyBoxRef = useRef<HTMLTextAreaElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Preserve scroll position during updates
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const {
    getThread, getCategory, getPostsForThread, prefetchPosts, unsubscribeFromThreadPosts,
    getPollForThread, addPost, editPost, deletePost,
    toggleWatch, isWatching: isWatchingFn, markThreadRead, forumStats, currentUser, loadingPosts,
    togglePostBookmark, isPostBookmarked,
  } = useForumContext();

  const { canManageThreads, canPinThreads, canLockThreads, canDeleteThreads, canFeatureThreads } = usePermissions();

  const thread = useMemo(() => threadId ? getThread(threadId) : null, [threadId, getThread]);
  const category = useMemo(() => thread ? getCategory(thread.categoryId) : null, [thread, getCategory]);
  const poll = useMemo(() => thread ? getPollForThread(thread.id) : null, [thread, getPollForThread]);

  // Prefetch posts when thread changes
  useEffect(() => {
    if (threadId) {
      prefetchPosts(threadId);
    }
  }, [threadId, prefetchPosts]);

  // Increment view count when thread is viewed
  useEffect(() => {
    if (!threadId) return;
    
    const incrementViewCount = async () => {
      try {
        const { error } = await supabase.rpc('increment_thread_views', { 
          thread_id: threadId 
        });
        
        if (error) {
          console.error('[ThreadDetailPage] Error incrementing view count:', error);
        }
      } catch (err) {
        console.error('[ThreadDetailPage] Error incrementing view count:', err);
      }
    };
    
    // Increment after a short delay to avoid counting quick bounces
    const timer = setTimeout(incrementViewCount, 1000);
    return () => clearTimeout(timer);
  }, [threadId]);

  // Get posts - stable reference to avoid scroll jumps
  const posts = thread ? getPostsForThread(thread.id) : [];

  // Scroll to post if hash is present in URL
  useEffect(() => {
    if (!loadingPosts[threadId || ''] && posts.length > 0) {
      const hash = window.location.hash.slice(1); // Remove the #
      if (hash) {
        // Wait a bit for the DOM to render
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the post briefly
            element.classList.add('ring-2', 'ring-forum-pink', 'ring-opacity-50');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-forum-pink', 'ring-opacity-50');
            }, 2000);
          }
        }, 500);
      }
    }
  }, [threadId, loadingPosts, posts.length]);

  // Clear posts when thread changes
  useEffect(() => {
    if (threadId && thread?.hasUnread) markThreadRead(threadId);
  }, [threadId, thread?.hasUnread, markThreadRead]);

  useEffect(() => {
    return () => { if (threadId) unsubscribeFromThreadPosts(threadId); };
  }, [threadId, unsubscribeFromThreadPosts]);

  const isWatching = threadId ? isWatchingFn(threadId) : false;

  const handleQuote = useCallback((author: string, content: string) => {
    const quoteText = `> **@${author}** wrote:\n> ${content}...\n\n`;
    setReplyText((prev) => prev + quoteText);
    setQuotedPost({ author, content: content + '...' });
    replyBoxRef.current?.focus();
    replyBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handlePostReply = useCallback(async () => {
    if (!replyText.trim() || !thread || isSubmittingReply) return;
    
    // Check authentication
    if (currentUser.id === 'guest') {
      toast.error('Please log in to post replies');
      return;
    }
    
    setIsSubmittingReply(true);
    const actualContent = quotedPost
      ? replyText.replace(/^(?:>.*\n)+\n?/m, '').trim() || replyText
      : replyText;
    try {
      await addPost(thread.id, actualContent, quotedPost);
      setReplyText('');
      setQuotedPost(undefined);
      toast.success('Reply posted successfully');
      setTimeout(() => {
        if (postsContainerRef.current) {
          const lastPost = postsContainerRef.current.lastElementChild;
          lastPost?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } catch (error) {
      console.error('Failed to post reply:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to post reply';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingReply(false);
    }
  }, [replyText, thread, quotedPost, addPost, isSubmittingReply, currentUser.id]);

  const handleEditPost = useCallback(async (postId: string, newContent: string) => {
    try { 
      await editPost(postId, newContent); 
      toast.success('Post updated successfully');
    } catch (error) { 
      const errorMessage = error instanceof Error ? error.message : 'Failed to update post';
      toast.error(errorMessage);
    }
  }, [editPost]);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      await deletePost(postId);
      toast.success('Post deleted successfully');
    } catch (error) { 
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete post';
      toast.error(errorMessage);
    }
  }, [deletePost]);

  const handleReportPost = useCallback(async (postId: string, reason: string, details: string) => {
    if (!currentUser) return;
    // Report functionality - to be implemented
    toast.success('Report submitted successfully');
  }, [currentUser]);

  const scrollToTop = useCallback(() => { postsContainerRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);
  const scrollToBottom = useCallback(() => { replyBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, []);

  const handleClearQuote = useCallback(() => { setReplyText(''); setQuotedPost(undefined); }, []);

  const handleInlineReply = useCallback(async (postId: string, content: string) => {
    if (!thread || inlineReplySubmitting) return;
    
    // Check authentication
    if (currentUser.id === 'guest') {
      toast.error('Please log in to reply to posts');
      setActiveReplyFormId(null);
      return;
    }
    
    setInlineReplySubmitting(true);
    try {
      const parentPost = posts.find(p => p.id === postId);
      const quotedData = parentPost ? { author: parentPost.author.username, content: parentPost.content.substring(0, 100) } : undefined;
      // Pass postId as replyTo parameter for threaded view
      await addPost(thread.id, content, quotedData, postId);
      setActiveReplyFormId(null);
      toast.success('Reply posted successfully');
      
      // Scroll to the new reply after a short delay
      setTimeout(() => {
        if (postsContainerRef.current) {
          const lastPost = postsContainerRef.current.lastElementChild;
          lastPost?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } catch (error) {
      console.error('Failed to post inline reply:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to post reply';
      toast.error(errorMessage);
    } finally {
      setInlineReplySubmitting(false);
    }
  }, [thread, posts, addPost, inlineReplySubmitting, currentUser.id]);

  const handleBookmarkPost = useCallback(async (postId: string) => {
    console.log('[handleBookmarkPost] Called for post:', postId);
    
    if (currentUser.id === 'guest') {
      console.log('[handleBookmarkPost] User is guest');
      toast.error('Please log in to bookmark posts');
      return;
    }
    
    const wasBookmarked = isPostBookmarked(postId);
    console.log('[handleBookmarkPost] Was bookmarked:', wasBookmarked);
    
    try {
      console.log('[handleBookmarkPost] Calling togglePostBookmark...');
      await togglePostBookmark(postId);
      console.log('[handleBookmarkPost] Success!');
      toast.success(wasBookmarked ? 'Bookmark removed' : 'Post bookmarked');
    } catch (error: any) {
      console.error('[handleBookmarkPost] Error:', error);
      toast.error(error?.message || 'Failed to bookmark post');
    }
  }, [currentUser.id, togglePostBookmark, isPostBookmarked]);

  if (!thread || !category) {
    return (
      <div className="min-h-screen bg-forum-bg flex items-center justify-center">
        <div className="hud-panel px-10 py-12 text-center">
          <div className="text-[40px] mb-4">
            <SearchX size={40} className="text-forum-pink mx-auto" />
          </div>
          <h2 className="text-[16px] font-bold text-forum-text font-mono mb-2">Thread Not Found</h2>
          <p className="text-[12px] text-forum-muted font-mono mb-6">The thread you&apos;re looking for doesn&apos;t exist.</p>
          <button onClick={() => navigate('/')} className="transition-forum rounded bg-forum-pink px-5 py-2.5 text-[11px] font-mono font-semibold text-white hover:shadow-pink-glow active:scale-95 border border-forum-pink/50">
            Back to Forums
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forum-bg">
      <ReadingProgressBar />

      <ForumHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMobileMenuOpen={isMobileMenuOpen} />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-4 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-forum-muted">
          <HomeIcon size={11} className="text-forum-pink" />
          <span onClick={() => navigate('/')} className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer">Forums</span>
          <ChevronRight size={10} />
          <span onClick={() => navigate(`/category/${category.id}`)} className="text-forum-text hover:text-forum-pink transition-forum cursor-pointer">{category.name}</span>
          <ChevronRight size={10} />
          <span className="text-forum-pink truncate max-w-[200px]">{thread.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 space-y-4">
        {/* Thread Header */}
        <ThreadHeader
          thread={thread}
          category={category}
          isWatching={isWatching}
          onToggleWatch={() => {
            if (currentUser.id === 'guest') {
              toast.error('Please log in to watch threads');
              return;
            }
            threadId && toggleWatch(threadId);
          }}
          onShare={() => setShowShareModal(true)}
        />

        {/* Mod Toolbar */}
        {canManageThreads && (
          <ModToolbar
            thread={thread}
            categoryId={category.id}
            canPinThreads={canPinThreads}
            canLockThreads={canLockThreads}
            canFeatureThreads={canFeatureThreads}
            canDeleteThreads={canDeleteThreads}
            onDeleteNavigate={() => navigate(`/category/${category.id}`)}
          />
        )}

        {/* Poll */}
        {poll && thread && <ThreadPoll poll={poll} threadId={thread.id} />}

        {/* Thread Navigation */}
        <ThreadNavigation postCount={posts.length} onScrollToTop={scrollToTop} onScrollToBottom={scrollToBottom} />

        <div className="flex gap-6">
          {/* Main content */}
          <div ref={postsContainerRef} className="flex-1 min-w-0 space-y-3">
            {threadId && loadingPosts[threadId] ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : posts.length === 0 ? (
              <div className="hud-panel p-8 text-center text-gray-400">No posts yet. Be the first to reply!</div>
            ) : (
              <>
                <PostSortingBar
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  isWatching={isWatching}
                  onToggleWatch={() => {
                    if (currentUser.id === 'guest') {
                      toast.error('Please log in to watch threads');
                      return;
                    }
                    threadId && toggleWatch(threadId);
                  }}
                />

                {/* Always use nested/threaded view */}
                <ThreadedPostList
                    posts={[...posts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())}
                    currentUserId={currentUser.id}
                    threadAuthorId={thread?.author.id || ''}
                    threadId={thread?.id || ''}
                    onQuote={handleQuote}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                    onReport={handleReportPost}
                    onBookmark={handleBookmarkPost}
                    isBookmarked={isPostBookmarked}
                    onReplyToPost={(postId) => setActiveReplyFormId(postId)}
                    activeReplyFormId={activeReplyFormId}
                    onInlineReply={handleInlineReply}
                    inlineReplySubmitting={inlineReplySubmitting}
                />
              </>
            )}

            <ThreadNavigation postCount={posts.length} onScrollToTop={scrollToTop} onScrollToBottom={scrollToBottom} />

            {/* Reply Editor */}
            <ReplyEditor
              isLocked={thread.isLocked}
              replyText={replyText}
              onReplyTextChange={setReplyText}
              quotedPost={quotedPost}
              onClearQuote={handleClearQuote}
              onSubmitReply={handlePostReply}
              isSubmitting={isSubmittingReply}
              replyBoxRef={replyBoxRef}
              threadId={threadId}
            />
          </div>

          {/* Sidebar */}
          <div className="hidden w-[280px] flex-shrink-0 space-y-4 lg:block">
            {/* Thread Info */}
            <div className="hud-panel p-4 space-y-3">
              <h4 className="text-[11px] font-mono font-bold text-forum-text uppercase tracking-wider flex items-center gap-2">
                <Award size={12} className="text-forum-pink" />
                Thread Info
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">Created</span>
                  <span className="text-[10px] font-mono text-forum-text">{formatTimeAgo(thread.createdAt)}</span>
                </div>
                <div className="h-[1px] bg-forum-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">Last Reply</span>
                  <span className="text-[10px] font-mono text-forum-text">{formatTimeAgo(thread.lastReplyAt)}</span>
                </div>
                <div className="h-[1px] bg-forum-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">Category</span>
                  <span onClick={() => navigate(`/category/${category.id}`)} className="text-[10px] font-mono text-forum-pink cursor-pointer hover:underline">{category.name.split('—')[0].trim()}</span>
                </div>
                <div className="h-[1px] bg-forum-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-forum-muted">Watching</span>
                  <span className={`text-[10px] font-mono ${isWatching ? 'text-forum-pink' : 'text-forum-muted'}`}>{isWatching ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="hud-panel p-4 space-y-3">
              <h4 className="text-[11px] font-mono font-bold text-forum-text uppercase tracking-wider flex items-center gap-2">
                <MessageCircle size={12} className="text-forum-pink" />
                Participants ({Array.from(new Set(posts.map((p) => p.author.id))).length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(posts.map((p) => p.author.id))).map((authorId) => {
                  const author = posts.find((p) => p.author.id === authorId)?.author;
                  if (!author) return null;
                  const postsByAuthor = posts.filter((p) => p.author.id === authorId).length;
                  return (
                    <div key={authorId} className="flex items-center gap-1.5 rounded-md bg-forum-bg/50 border border-forum-border/30 px-2 py-1 group hover:border-forum-pink/20 transition-forum">
                      <img src={author.avatar} alt={author.username} className="h-5 w-5 rounded object-cover border border-forum-border" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono text-forum-text group-hover:text-forum-pink transition-forum">{author.username}</span>
                        <span className="text-[7px] font-mono text-forum-muted">{postsByAuthor} post{postsByAuthor !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  );
                })}
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
                    <span key={tag} className="rounded-sm border border-forum-pink/15 bg-forum-pink/[0.05] px-2 py-1 text-[9px] font-mono font-medium text-forum-pink/80 hover:bg-forum-pink/10 hover:text-forum-pink transition-forum cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <RelatedThreads currentThread={thread.id} categoryId={thread.categoryId} />
            <SidebarStatsPanel stats={forumStats} />
            <PopularTags />
            <OnlineUsers />
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] overflow-y-auto border-l border-forum-border bg-forum-card p-4 space-y-4">
            <SidebarStatsPanel stats={forumStats} />
            <PopularTags />
            <OnlineUsers />
          </div>
        </div>
      )}

      <FloatingActionButton onClick={() => setIsModalOpen(true)} />
      <ScrollToTopButton />
      <NewThreadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} threadTitle={thread.title} threadId={thread.id} />
      <MobileBottomNav />
    </div>
  );
}
