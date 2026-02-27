import {
  Bold,
  Italic,
  Strikethrough,
  Heading,
  Code,
  Link as LinkIcon,
  List,
  Table,
  EyeOff,
  AtSign,
  Quote,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Emoji Constants
// ============================================================================

export const COMMON_EMOJIS = [
  '😀', '😂', '🤔', '👍', '👎', '🔥', '💡', '❤️', '🎉', '👀',
  '🚀', '💯', '🐛', '⚡', '🤖', '🎯', '✅', '❌', '⚠️', '💀',
  '🧠', '💻', '🔧', '📦', '🎨', '🛡️', '☕', '🌟', '😎', '🤝',
] as const;

export const REACTION_EMOJIS = [
  { emoji: '👍', label: 'Helpful' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💡', label: 'Insightful' },
  { emoji: '😂', label: 'Funny' },
  { emoji: '🎯', label: 'On Point' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '👀', label: 'Watching' },
] as const;

// ============================================================================
// Markdown Toolbar Actions
// ============================================================================

export interface MarkdownAction {
  icon: LucideIcon | null;
  iconLabel?: string; // For text-only buttons (like "{}")
  tooltip: string;
  insertText: string;
  separator?: boolean; // Whether to show separator before this action
}

export const MARKDOWN_TOOLBAR_ACTIONS: MarkdownAction[] = [
  { icon: Bold, tooltip: 'Bold', insertText: '**bold**' },
  { icon: Italic, tooltip: 'Italic', insertText: '*italic*' },
  { icon: Strikethrough, tooltip: 'Strikethrough', insertText: '~~strikethrough~~' },
  { icon: Heading, tooltip: 'Heading', insertText: '## Heading' },
  { icon: null, iconLabel: '{}', tooltip: 'Inline Code', insertText: '`inline code`', separator: true },
  { icon: LinkIcon, tooltip: 'Link', insertText: '[link text](url)' },
  { icon: Code, tooltip: 'Code Block', insertText: '\n```\ncode\n```\n' },
  { icon: List, tooltip: 'List', insertText: '\n- item\n- item\n- item\n' },
  { icon: Table, tooltip: 'Insert Table', insertText: '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n', separator: true },
  { icon: EyeOff, tooltip: 'Spoiler Tag', insertText: '\n[spoiler]Hidden content goes here[/spoiler]\n' },
  { icon: AtSign, tooltip: 'Mention', insertText: '@' },
  { icon: Quote, tooltip: 'Blockquote', insertText: '> ' },
];

// ============================================================================
// Report Reasons
// ============================================================================

export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'off_topic', label: 'Off-topic' },
  { value: 'duplicate', label: 'Duplicate post' },
  { value: 'other', label: 'Other' },
] as const;

// ============================================================================
// Threading Constants
// ============================================================================

export const MAX_THREAD_DEPTH = 3;

// ============================================================================
// Pagination Constants
// ============================================================================

export const DEFAULT_POSTS_PER_PAGE = 20;
export const DEFAULT_THREADS_PER_PAGE = 25;
