import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bold,
  Italic,
  Link as LinkIcon,
  Code,
  List,
  PenSquare,
  Check,
  AlertCircle,
  Tag,
  Table,
  EyeOff,
  Strikethrough,
  Heading,
  Smile,
} from 'lucide-react';
import { useForumContext } from '@/context/ForumContext';
import ImageUploadButton from '@/components/forum/ImageUploadButton';

interface NewThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
}

export default function NewThreadModal({ isOpen, onClose, defaultCategoryId }: NewThreadModalProps) {
  const navigate = useNavigate();
  const { categories, createThread } = useForumContext();
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategoryId || '');

  // Sync selectedCategory when defaultCategoryId prop changes
  useEffect(() => {
    if (defaultCategoryId) {
      setSelectedCategory(defaultCategoryId);
    }
  }, [defaultCategoryId]);
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [errors, setErrors] = useState<{ title?: string; category?: string; content?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const commonEmojis = [
    '😀', '😂', '🤔', '👍', '👎', '🔥', '💡', '❤️', '🎉', '👀',
    '🚀', '💯', '🐛', '⚡', '🤖', '🎯', '✅', '❌', '⚠️', '💀',
    '🧠', '💻', '🔧', '📦', '🎨', '🛡️', '☕', '🌟', '😎', '🤝',
  ];

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    else if (title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters';
    if (!selectedCategory) newErrors.category = 'Please select a category';
    if (!content.trim()) newErrors.content = 'Content is required';
    else if (content.trim().length < 10) newErrors.content = 'Content must be at least 10 characters';

    // Check if category is mod-only
    const cat = categories.find((c) => c.id === selectedCategory);
    if (cat?.isImportant) {
      newErrors.category = 'This category is for moderators only';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse tags
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
        .filter((t) => t.length > 0);

      // Create the thread through context (now async)
      const newThread = await createThread(title.trim(), selectedCategory, content.trim(), tags);

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccess(false);
        setTitle('');
        setSelectedCategory(defaultCategoryId || '');
        setContent('');
        setTagsInput('');
        setErrors({});
        onClose();
        // Navigate to the new thread
        navigate(`/thread/${newThread.id}`);
      }, 800);
    } catch (error) {
      // Handle error
      setIsSubmitting(false);
      setErrors({ content: 'Failed to create thread. Please try again.' });
      console.error('Failed to create thread:', error);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setTitle('');
    setSelectedCategory(defaultCategoryId || '');
    setContent('');
    setTagsInput('');
    setErrors({});
    setShowEmojiPicker(false);
    onClose();
  };

  const insertMarkdown = (syntax: string) => {
    setContent((prev) => prev + syntax);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-2xl hud-panel max-h-[90vh] overflow-y-auto">
        {/* Success overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-forum-card/95 backdrop-blur-sm rounded">
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40 mx-auto mb-3">
                <Check size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-[14px] font-mono font-bold text-forum-text mb-1">Thread Created!</h3>
              <p className="text-[11px] font-mono text-forum-muted">Redirecting to your thread...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-forum-border px-6 py-4">
          <div className="flex items-center gap-2">
            <PenSquare size={16} className="text-forum-pink" />
            <h2 className="text-[14px] font-bold text-forum-text font-mono">Create New Thread</h2>
          </div>
          <button
            onClick={handleClose}
            className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[10px] font-mono font-bold text-forum-muted uppercase tracking-wider">
              Thread Title <span className="text-forum-pink">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors({ ...errors, title: undefined });
              }}
              placeholder="Enter your thread title..."
              maxLength={200}
              className={`transition-forum w-full rounded border bg-forum-bg px-4 py-2.5 text-[12px] font-mono text-forum-text placeholder-forum-muted outline-none focus:ring-1 ${
                errors.title
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                  : 'border-forum-border focus:border-forum-pink focus:ring-forum-pink/30'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.title ? (
                <p className="text-[10px] text-red-400 font-mono flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.title}
                </p>
              ) : (
                <span />
              )}
              <span className="text-[9px] font-mono text-forum-muted/40">{title.length}/200</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-[10px] font-mono font-bold text-forum-muted uppercase tracking-wider">
              Category <span className="text-forum-pink">*</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setErrors({ ...errors, category: undefined });
              }}
              className={`transition-forum w-full appearance-none rounded border bg-forum-bg px-4 py-2.5 pr-8 text-[12px] font-mono text-forum-text outline-none cursor-pointer focus:ring-1 ${
                errors.category
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                  : 'border-forum-border focus:border-forum-pink focus:ring-forum-pink/30'
              }`}
            >
              <option value="" className="bg-forum-card">Select a category...</option>
              {categories
                .filter((cat) => !cat.isImportant)
                .map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-forum-card">
                    {cat.name}
                  </option>
                ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-[10px] text-red-400 font-mono flex items-center gap-1">
                <AlertCircle size={10} /> {errors.category}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-[10px] font-mono font-bold text-forum-muted uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={10} className="text-forum-pink/60" />
              Tags <span className="text-forum-muted/40 font-normal">(optional, comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., typescript, react, help"
              className="transition-forum w-full rounded border border-forum-border bg-forum-bg px-4 py-2.5 text-[12px] font-mono text-forum-text placeholder-forum-muted outline-none focus:ring-1 focus:border-forum-pink focus:ring-forum-pink/30"
            />
            {tagsInput && (
              <div className="flex items-center gap-1 flex-wrap mt-2">
                {tagsInput.split(',').map((tag, i) => {
                  const trimmed = tag.trim().toLowerCase().replace(/^#/, '');
                  if (!trimmed) return null;
                  return (
                    <span
                      key={i}
                      className="rounded-sm border border-forum-pink/20 bg-forum-pink/[0.05] px-2 py-0.5 text-[9px] font-mono font-medium text-forum-pink/80"
                    >
                      #{trimmed}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 block text-[10px] font-mono font-bold text-forum-muted uppercase tracking-wider">
              Content <span className="text-forum-pink">*</span>
            </label>
            {/* Rich text editor toolbar */}
            <div className="flex items-center gap-1 rounded-t border border-b-0 border-forum-border bg-forum-card-alt px-2 py-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => insertMarkdown('**bold**')}
                className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
                title="Bold"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('*italic*')}
                className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
                title="Italic"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('~~strikethrough~~')}
                className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
                title="Strikethrough"
              >
                <Strikethrough size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('## Heading')}
                className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
                title="Heading"
              >
                <Heading size={14} />
              </button>
              <div className="w-px h-4 bg-forum-border/30 mx-0.5" />
              <button
                type="button"
                onClick={() => insertMarkdown('`inline code`')}
                className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
                title="Inline Code"
              >
                <span className="text-[10px] font-mono font-bold">{'{}'}</span>
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('[link text](url)')}
                className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
                title="Link"
              >
                <LinkIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('\n```\ncode\n```\n')}
                className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
                title="Code Block"
              >
                <Code size={14} />
              </button>
              <ImageUploadButton
                onImageInsert={(markdown) => setContent((prev) => prev + markdown)}
              />
              <button
                type="button"
                onClick={() => insertMarkdown('\n- item\n- item\n- item\n')}
                className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
                title="List"
              >
                <List size={14} />
              </button>
              <div className="w-px h-4 bg-forum-border/30 mx-0.5" />
              <button
                type="button"
                onClick={() => insertMarkdown('\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n')}
                className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
                title="Insert Table"
              >
                <Table size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('\n[spoiler]Hidden content goes here[/spoiler]\n')}
                className="transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink"
                title="Spoiler Tag"
              >
                <EyeOff size={14} />
              </button>
              {/* Emoji picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`transition-forum rounded p-1.5 hover:bg-forum-hover ${showEmojiPicker ? 'text-forum-pink bg-forum-pink/10' : 'text-forum-muted hover:text-forum-pink'}`}
                  title="Emoji Picker"
                >
                  <Smile size={14} />
                </button>
                {showEmojiPicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                    <div className="absolute left-0 bottom-full mb-1 z-20 hud-panel w-[220px] p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] font-mono font-bold text-forum-muted uppercase tracking-wider">Emoji</span>
                        <button type="button" onClick={() => setShowEmojiPicker(false)} className="text-forum-muted hover:text-forum-text transition-forum">
                          <X size={10} />
                        </button>
                      </div>
                      <div className="grid grid-cols-10 gap-0.5">
                        {commonEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              insertMarkdown(emoji);
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
              <span className="text-[8px] font-mono text-forum-muted/40">Markdown supported</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setErrors({ ...errors, content: undefined });
              }}
              placeholder="Write your thread content here... (Markdown supported)"
              rows={8}
              className={`transition-forum w-full rounded-b border bg-forum-bg px-4 py-3 text-[12px] font-mono text-forum-text placeholder-forum-muted outline-none resize-none focus:ring-1 leading-relaxed ${
                errors.content
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                  : 'border-forum-border focus:border-forum-pink focus:ring-forum-pink/30'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.content ? (
                <p className="text-[10px] text-red-400 font-mono flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.content}
                </p>
              ) : (
                <span />
              )}
              <span className="text-[9px] font-mono text-forum-muted/40">{content.length} chars</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-forum-border px-6 py-4">
          <span className="text-[9px] font-mono text-forum-muted/40">
            <span className="text-forum-pink">*</span> Required fields
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="transition-forum rounded-sm border border-forum-border/50 bg-forum-card/50 px-4 py-2 text-[11px] font-mono font-bold text-forum-muted hover:bg-forum-hover hover:text-forum-text hover:border-forum-pink/40 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="transition-forum rounded-sm bg-gradient-to-r from-forum-pink to-forum-pink/90 px-5 py-2 text-[11px] font-mono font-bold text-white hover:shadow-[0_0_20px_rgba(255,45,146,0.4)] active:scale-95 border border-forum-pink/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
