import { useState, useRef } from 'react';
import { Reply, X, Send } from 'lucide-react';
import MarkdownToolbar from '../editor/MarkdownToolbar';
import EmojiPicker from '../editor/EmojiPicker';

interface InlineReplyFormProps {
  parentAuthor: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function InlineReplyForm({
  parentAuthor,
  onSubmit,
  onCancel,
  isSubmitting,
}: InlineReplyFormProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsert = (insertText: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = text.slice(0, start);
      const after = text.slice(end);
      setText(before + insertText + after);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
      });
    } else {
      setText(text + insertText);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    await onSubmit(text);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="mt-2 rounded-md border border-forum-pink/20 bg-forum-card/80 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-forum-pink/[0.04] border-b border-forum-border/15">
        <span className="text-[9px] font-mono text-forum-muted flex items-center gap-1.5">
          <Reply size={10} className="text-forum-pink" />
          Replying to <span className="text-forum-pink font-semibold">@{parentAuthor}</span>
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-forum-muted hover:text-forum-text transition-forum"
        >
          <X size={10} />
        </button>
      </div>
      <div className="p-2">
        <MarkdownToolbar onInsert={handleInsert}>
          <EmojiPicker onSelect={handleInsert} iconSize={10} />
        </MarkdownToolbar>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a reply..."
          autoFocus
          className="w-full h-20 bg-forum-bg border border-forum-border/20 rounded px-2.5 py-2 text-[11px] font-mono text-forum-text placeholder:text-forum-muted/40 focus:outline-none focus:border-forum-pink/30 focus:ring-1 focus:ring-forum-pink/10 transition-forum resize-none"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[8px] font-mono text-forum-muted/40">
            Esc to cancel · Ctrl+Enter to submit
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onCancel}
              className="transition-forum rounded px-2.5 py-1 text-[9px] font-mono text-forum-muted border border-forum-border/20 hover:text-forum-text hover:border-forum-border/40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim() || isSubmitting}
              className="transition-forum rounded bg-forum-pink px-3 py-1 text-[9px] font-mono font-semibold text-white hover:shadow-pink-glow active:scale-95 border border-forum-pink/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white" />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={9} />
                  Reply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
