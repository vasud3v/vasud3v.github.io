import { Reply, Quote, X, Eye, Edit3 } from 'lucide-react';
import { useState, useCallback } from 'react';
import ImageUploadButton from '@/components/forum/ImageUploadButton';
import MarkdownToolbar from '../editor/MarkdownToolbar';
import EmojiPicker from '../editor/EmojiPicker';
import MentionAutocomplete from '../editor/MentionAutocomplete';
import PostContentRenderer from '../PostContentRenderer';
import { useDraftAutoSave } from '@/hooks/forum/useDraftAutoSave';

interface ReplyEditorProps {
  isLocked: boolean;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  quotedPost?: { author: string; content: string };
  onClearQuote: () => void;
  onSubmitReply: () => void;
  isSubmitting: boolean;
  replyBoxRef: React.RefObject<HTMLTextAreaElement | null>;
  threadId?: string;
}

export default function ReplyEditor({
  isLocked,
  replyText,
  onReplyTextChange,
  quotedPost,
  onClearQuote,
  onSubmitReply,
  isSubmitting,
  replyBoxRef,
  threadId,
}: ReplyEditorProps) {
  const [previewMode, setPreviewMode] = useState<'write' | 'preview'>('write');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });

  const { draftRestored, clearDraft } = useDraftAutoSave(
    threadId ? `reply-${threadId}` : 'reply-new',
    replyText,
    onReplyTextChange,
  );

  const handleInsert = (text: string) => {
    const textarea = replyBoxRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = replyText.slice(0, start);
      const after = replyText.slice(end);
      onReplyTextChange(before + text + after);
      // Restore cursor after the inserted text
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
      });
    } else {
      onReplyTextChange(replyText + text);
    }
  };

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    onReplyTextChange(newText);

    // Check for @ mention trigger
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newText.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      const query = match[1];
      setMentionQuery(query);

      // Calculate position for autocomplete dropdown
      const rect = e.target.getBoundingClientRect();
      setMentionPosition({
        top: rect.top - 200, // Position above textarea
        left: rect.left + 20,
      });
    } else {
      setMentionQuery(null);
    }
  }, [onReplyTextChange]);

  const handleMentionSelect = useCallback((username: string) => {
    const textarea = replyBoxRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = replyText.slice(0, cursorPos);
    const textAfterCursor = replyText.slice(cursorPos);

    // Replace the @query with @username
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const newText = textBeforeCursor.slice(0, atIndex) + `@${username} ` + textAfterCursor;

    onReplyTextChange(newText);
    setMentionQuery(null);

    // Restore focus and cursor position
    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = atIndex + username.length + 2; // +2 for @ and space
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    });
  }, [replyText, onReplyTextChange, replyBoxRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't handle Ctrl+Enter if mention autocomplete is open
    if (mentionQuery !== null) return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (replyText.trim() && !isSubmitting) {
        onSubmitReply();
        clearDraft();
      }
    }
  };

  const handleSubmit = () => {
    onSubmitReply();
    clearDraft();
  };

  const handleDiscard = () => {
    onClearQuote();
    clearDraft();
  };

  if (isLocked) {
    return (
      <div className="hud-panel px-4 py-3 flex items-center gap-3 border-amber-500/20 bg-amber-500/[0.04]">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 flex-shrink-0"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span className="text-[11px] font-mono text-amber-400">
          This thread is locked. No new replies can be posted.
        </span>
      </div>
    );
  }

  return (
    <div className="hud-panel overflow-hidden" id="reply-box">
      <div className="px-4 py-2 border-b border-forum-border/20 bg-forum-card-alt/30 flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold text-forum-text flex items-center gap-2">
          <Reply size={12} className="text-forum-pink" />
          Post a Reply
          {draftRestored && (
            <span className="text-[9px] font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-0.5">
              Draft restored
            </span>
          )}
        </span>

        {/* Write/Preview Toggle */}
        <div className="flex items-center gap-1 border border-forum-border/30 rounded-md overflow-hidden">
          <button
            onClick={() => setPreviewMode('write')}
            className={`px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-forum flex items-center gap-1 ${
              previewMode === 'write'
                ? 'bg-forum-pink text-white'
                : 'text-forum-muted hover:text-forum-text'
            }`}
          >
            <Edit3 size={9} />
            Write
          </button>
          <button
            onClick={() => setPreviewMode('preview')}
            className={`px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-forum flex items-center gap-1 ${
              previewMode === 'preview'
                ? 'bg-forum-pink text-white'
                : 'text-forum-muted hover:text-forum-text'
            }`}
          >
            <Eye size={9} />
            Preview
          </button>
        </div>
      </div>

      <div className="p-4">
        {previewMode === 'write' ? (
          <>
            {/* Toolbar */}
            <MarkdownToolbar onInsert={handleInsert}>
              <ImageUploadButton
                onImageInsert={handleInsert}
                className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
                iconSize={12}
              />
              <EmojiPicker onSelect={handleInsert} iconSize={12} />
            </MarkdownToolbar>

            {/* Quote preview */}
            {replyText.startsWith('>') && (
              <div className="mb-2 rounded-md border-l-2 border-forum-pink/30 bg-forum-bg/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-mono text-forum-muted flex items-center gap-1">
                    <Quote size={8} className="text-forum-pink/60" />{' '}
                    Quoting
                  </span>
                  <button
                    onClick={onClearQuote}
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
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Write your reply... (Markdown supported, type @ to mention)"
              className="w-full h-36 bg-forum-bg border border-forum-border/30 rounded-md px-3 py-2.5 text-[12px] font-mono text-forum-text placeholder:text-forum-muted/40 focus:outline-none focus:border-forum-pink/40 focus:ring-1 focus:ring-forum-pink/20 transition-forum resize-none"
            />

            {/* Mention Autocomplete */}
            {mentionQuery !== null && (
              <MentionAutocomplete
                query={mentionQuery}
                position={mentionPosition}
                onSelect={handleMentionSelect}
                onClose={() => setMentionQuery(null)}
              />
            )}
          </>
        ) : (
          <div className="min-h-[144px] bg-forum-bg border border-forum-border/30 rounded-md px-3 py-2.5">
            {replyText.trim() ? (
              <PostContentRenderer content={replyText} />
            ) : (
              <div className="text-[12px] font-mono text-forum-muted/40 italic">
                Nothing to preview yet. Write something in the Write tab.
              </div>
            )}
          </div>
        )}

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
                onClick={handleDiscard}
                className="transition-forum rounded-md px-3 py-2 text-[10px] font-mono text-forum-muted border border-forum-border/30 hover:text-forum-text hover:border-forum-border/50"
              >
                Discard
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="transition-forum rounded-md bg-forum-pink px-4 py-2 text-[11px] font-mono font-semibold text-white hover:shadow-pink-glow active:scale-95 border border-forum-pink/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={!replyText.trim() || isSubmitting}
            >
              {isSubmitting ? (
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
  );
}
