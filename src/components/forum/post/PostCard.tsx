import { memo } from 'react';
import { PostData } from '@/types/forum';
import PostContentRenderer from '@/components/forum/PostContentRenderer';
import { Clock, History } from 'lucide-react';
import PostAuthorSidebar from '@/components/forum/post/PostAuthorSidebar';
import PostActions from '@/components/forum/post/PostActions';
import InlineReplyForm from '@/components/forum/thread/InlineReplyForm';

interface PostCardProps {
  post: PostData;
  index: number;
  isOP: boolean;
  currentUserId: string;
  threadAuthorId: string;
  threadId: string;
  depth?: number;
  onQuote: (author: string, content: string) => void;
  onEdit: (postId: string, newContent: string, reason?: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onReport?: (postId: string, reason: string, details: string) => Promise<void>;
  onBookmark?: (postId: string) => Promise<void>;
  isBookmarked?: boolean;
  onReplyToPost?: (postId: string) => void;
  activeReplyFormId?: string | null;
  onInlineReply?: (postId: string, content: string) => Promise<void>;
  inlineReplySubmitting?: boolean;
}

const PostCard = memo(({
  post,
  index,
  isOP,
  currentUserId,
  threadAuthorId,
  threadId,
  depth = 0,
  onQuote,
  onEdit,
  onDelete,
  onReport,
  onBookmark,
  isBookmarked = false,
  onReplyToPost,
  activeReplyFormId,
  onInlineReply,
  inlineReplySubmitting = false,
}: PostCardProps) => {
  const isOwnPost = post.author.id === currentUserId;
  const postAge = Date.now() - new Date(post.createdAt).getTime();
  const requireEditReason = postAge > 5 * 60 * 1000; // 5 minutes

  // Calculate indentation based on depth
  const indentClass = depth > 0 ? `ml-${Math.min(depth, 3) * 6}` : '';
  const showReplyingToBadge = depth >= 3 && post.replyTo;

  return (
    <div
      id={post.id}
      className={`hud-panel scroll-mt-20 flex flex-col md:flex-row relative rounded-xl ${indentClass}`}
      style={{ 
        zIndex: Math.max(1, 100 - Math.min(index, 99)),
        marginLeft: depth > 0 ? `${Math.min(depth, 3) * 24}px` : '0',
      }}
    >
      {/* Connecting line for nested replies */}
      {depth > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-forum-border/30"
          style={{ left: '-12px' }}
        />
      )}

      {/* Author Sidebar */}
      <PostAuthorSidebar
        author={post.author || { 
          id: 'deleted', 
          username: '[Deleted User]', 
          avatar: '/default-avatar.png',
          postCount: 0,
          reputation: 0,
          joinDate: new Date().toISOString(),
          isOnline: false,
          rank: 'Guest',
          role: 'member'
        }}
        isOP={isOP}
        currentUserId={currentUserId}
      />

      {/* Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Post Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-forum-border/10 bg-forum-bg/20">
          <div className="flex items-center gap-3">
            {showReplyingToBadge && post.replyTo && (
              <span className="text-[9px] font-mono text-forum-pink bg-forum-pink/10 border border-forum-pink/30 rounded px-2 py-0.5">
                Replying to @{post.replyTo}
              </span>
            )}
            <span className="text-[10px] font-mono text-forum-muted flex items-center gap-1">
              <Clock size={10} />
              {new Date(post.createdAt).toLocaleString()}
            </span>
            {post.editedAt && (
              <span className="text-[9px] font-mono text-forum-muted/60 flex items-center gap-1">
                <History size={9} />
                edited
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-forum-muted">
              #{index + 1}
            </span>
          </div>
        </div>

        {/* Post Body */}
        <div className="px-5 py-4 flex-1 flex flex-col">
          <PostContentRenderer content={post.content} />
          {post.editedAt && (
            <div className="mt-4 text-[10px] font-mono italic text-forum-muted/70">
              Last edited: {new Date(post.editedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
          )}
        </div>

        {/* Post Actions */}
        <PostActions
          post={post}
          isOwnPost={isOwnPost}
          isBookmarked={isBookmarked}
          requireEditReason={requireEditReason}
          threadId={threadId}
          currentUserId={currentUserId}
          onQuote={onQuote}
          onEdit={onEdit}
          onDelete={onDelete}
          onReport={onReport}
          onBookmark={onBookmark}
          onReplyToPost={onReplyToPost}
        />

        {/* Inline Reply Form */}
        {activeReplyFormId === post.id && onInlineReply && (
          <div className="px-4 pb-3">
            <InlineReplyForm
              parentAuthor={post.author.username}
              onSubmit={(content) => onInlineReply(post.id, content)}
              onCancel={() => onReplyToPost?.(null as any)}
              isSubmitting={inlineReplySubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;
