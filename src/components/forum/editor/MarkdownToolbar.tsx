import { MARKDOWN_TOOLBAR_ACTIONS } from '@/lib/forumConstants';

interface MarkdownToolbarProps {
  onInsert: (text: string) => void;
  /** Slot rendered after the toolbar actions (e.g. image upload, emoji picker) */
  children?: React.ReactNode;
}

export default function MarkdownToolbar({ onInsert, children }: MarkdownToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 pb-2 border-b border-forum-border/20 mb-2 flex-wrap">
      {MARKDOWN_TOOLBAR_ACTIONS.map((action, i) => (
        <span key={i} className="contents">
          {action.separator && <div className="w-px h-4 bg-forum-border/30 mx-0.5" />}
          <button
            type="button"
            onClick={() => onInsert(action.insertText)}
            className="transition-forum rounded p-1.5 text-forum-muted hover:text-forum-pink hover:bg-forum-pink/5"
            title={action.tooltip}
          >
            {action.icon ? (
              <action.icon size={12} />
            ) : (
              <span className="text-[9px] font-mono font-bold">{action.iconLabel}</span>
            )}
          </button>
        </span>
      ))}
      {children}
      <div className="flex-1" />
      <span className="text-[8px] font-mono text-forum-muted/40 hidden sm:inline">
        Markdown supported · Ctrl+Enter to submit
      </span>
    </div>
  );
}
