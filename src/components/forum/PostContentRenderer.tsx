import { useState, useMemo, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { EmbedRenderer } from './EmbedRenderer';
import { parseEmbeddableUrl, isStandaloneUrl } from '@/lib/embed-parser';
import { Code, EyeOff, Copy, Check } from 'lucide-react';

interface PostContentRendererProps {
  content: string;
}

// Splits content into segments: plain text, spoiler blocks, and standalone embed URLs.
// This pre-processing is needed because [spoiler] tags and auto-embeds are custom
// syntax that react-markdown doesn't handle natively.
interface Segment {
  type: 'markdown' | 'spoiler' | 'embed';
  content: string;
}

function parseSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  // Split on spoiler tags first
  const spoilerRegex = /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi;
  let lastIndex = 0;
  let match;

  while ((match = spoilerRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'markdown', content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'spoiler', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'markdown', content: content.slice(lastIndex) });
  }

  // Now split markdown segments further to extract standalone embed URLs
  const expanded: Segment[] = [];
  for (const seg of segments) {
    if (seg.type !== 'markdown') {
      expanded.push(seg);
      continue;
    }

    const lines = seg.content.split('\n');
    let mdBuffer: string[] = [];

    const flushBuffer = () => {
      if (mdBuffer.length > 0) {
        expanded.push({ type: 'markdown', content: mdBuffer.join('\n') });
        mdBuffer = [];
      }
    };

    for (const line of lines) {
      if (isStandaloneUrl(line)) {
        const embedData = parseEmbeddableUrl(line.trim());
        if (embedData && embedData.type !== 'link') {
          flushBuffer();
          expanded.push({ type: 'embed', content: line.trim() });
          continue;
        }
      }
      mdBuffer.push(line);
    }
    flushBuffer();
  }

  return expanded;
}

// Code block wrapper with language label and copy button
function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') || '';

  const handleCopy = async () => {
    const text = extractText(children);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-HTTPS
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      // Still show copied state even if it failed
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-3 rounded-md border border-forum-border/40 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-forum-bg border-b border-forum-border/30">
        <span className="text-[8px] font-mono uppercase tracking-wider text-forum-muted">
          {lang || 'code'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-forum-muted/50 hover:text-forum-pink transition-forum text-[9px] font-mono"
          >
            {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <Code size={10} className="text-forum-muted/50" />
        </div>
      </div>
      <pre className="px-3 py-3 bg-forum-bg/80 overflow-x-auto !m-0 !rounded-none">
        <code className={`text-[11px] font-mono ${className || ''}`}>
          {children}
        </code>
      </pre>
    </div>
  );
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as any).props.children);
  }
  return '';
}

// Spoiler block component
function SpoilerBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <span className="inline-block my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="transition-forum flex items-center gap-1.5 text-[10px] font-mono font-semibold text-forum-pink/80 hover:text-forum-pink bg-forum-pink/[0.04] hover:bg-forum-pink/[0.08] border border-forum-pink/15 hover:border-forum-pink/30 rounded-md px-2.5 py-1.5"
      >
        <EyeOff size={10} />
        {expanded ? 'Hide Spoiler' : 'Show Spoiler'}
      </button>
      {expanded && (
        <div className="mt-1.5 px-3 py-2 bg-forum-bg/60 border border-forum-border/30 rounded-md text-forum-text/80 animate-in fade-in duration-200">
          <MarkdownBlock content={content} />
        </div>
      )}
    </span>
  );
}

// Custom component overrides for react-markdown to match forum styling
const markdownComponents: Components = {
  // Headings
  h1: ({ children }) => (
    <div className="text-[18px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),
  h2: ({ children }) => (
    <div className="text-[16px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),
  h3: ({ children }) => (
    <div className="text-[14px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),
  h4: ({ children }) => (
    <div className="text-[13px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),
  h5: ({ children }) => (
    <div className="text-[12px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),
  h6: ({ children }) => (
    <div className="text-[11px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="my-1 leading-relaxed">{processMentions(children)}</p>
  ),

  // Bold / Italic
  strong: ({ children }) => <strong className="font-bold text-forum-text">{children}</strong>,
  em: ({ children }) => <em className="italic text-forum-text/80">{children}</em>,

  // Strikethrough
  del: ({ children }) => <del className="text-forum-muted/60">{children}</del>,

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-forum-pink hover:underline decoration-forum-pink/30 hover:decoration-forum-pink/60"
    >
      {children}
    </a>
  ),

  // Images
  img: ({ src, alt }) => (
    <div className="my-2">
      <img
        src={src}
        alt={alt || ''}
        className="max-w-full max-h-[400px] rounded-md border border-forum-border/30 object-contain"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  ),

  // Lists
  ul: ({ children }) => <ul className="my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 space-y-0.5 list-decimal list-inside">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 my-0.5">
      <span className="text-forum-pink mt-1 shrink-0">&#8226;</span>
      <span className="flex-1">{children}</span>
    </li>
  ),

  // Inline code
  code: ({ className, children }) => {
    // If it has a language class, it's inside a <pre> - rehype-highlight handles this
    if (className) {
      return <code className={className}>{children}</code>;
    }
    // Inline code
    return (
      <code className="px-1.5 py-0.5 rounded bg-forum-bg border border-forum-border/30 text-[11px] text-forum-pink/90 font-mono">
        {children}
      </code>
    );
  },

  // Code blocks (pre wraps code)
  pre: ({ children }) => {
    // Extract the code element's props
    const codeChild = children as any;
    const className = codeChild?.props?.className || '';
    const codeContent = codeChild?.props?.children;
    return <CodeBlock className={className}>{codeContent}</CodeBlock>;
  },

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="my-2 pl-3 border-l-2 border-forum-pink/40 text-forum-text/70 italic">
      {children}
    </blockquote>
  ),

  // Horizontal rules
  hr: () => <hr className="my-4 border-forum-border/30" />,

  // Tables
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-md border border-forum-border/40">
      <table className="w-full text-[11px] font-mono">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-forum-bg border-b border-forum-border/30">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-bold text-forum-pink/80 uppercase tracking-wider text-[9px]">
      {children}
    </th>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-forum-border/15 last:border-b-0 hover:bg-forum-pink/[0.02] transition-forum">
      {children}
    </tr>
  ),
  td: ({ children }) => <td className="px-3 py-1.5 text-forum-text/80">{children}</td>,

  // Task list items (GFM checkboxes)
  input: ({ checked, type, ...props }) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mr-1.5 accent-forum-pink rounded"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  },
};

// Highlight @mentions in text children
function processMentions(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    return processMentionString(children);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') return <span key={i}>{processMentionString(child)}</span>;
      return child;
    });
  }
  return children;
}

function processMentionString(text: string): ReactNode {
  const parts = text.split(/(@\w+)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="text-forum-pink font-semibold cursor-pointer hover:underline">
          {part}
        </span>
      );
    }
    return part;
  });
}

// Renders a markdown string with react-markdown
function MarkdownBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function PostContentRenderer({ content }: PostContentRendererProps) {
  const segments = useMemo(() => parseSegments(content), [content]);

  return (
    <div className="text-[13px] font-mono text-forum-text/90 leading-relaxed flex-1 break-words post-content">
      {segments.map((seg, i) => {
        switch (seg.type) {
          case 'spoiler':
            return <SpoilerBlock key={i} content={seg.content} />;

          case 'embed': {
            const embedData = parseEmbeddableUrl(seg.content);
            if (embedData && embedData.type !== 'link') {
              return <EmbedRenderer key={i} embed={embedData} />;
            }
            return <MarkdownBlock key={i} content={seg.content} />;
          }

          case 'markdown':
            return <MarkdownBlock key={i} content={seg.content} />;

          default:
            return null;
        }
      })}
    </div>
  );
}
