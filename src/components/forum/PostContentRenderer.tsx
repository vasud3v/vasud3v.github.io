import { useState } from 'react';
import { EmbedRenderer } from './EmbedRenderer';
import { parseEmbeddableUrl, isStandaloneUrl } from '@/lib/embed-parser';
import {
  Code, EyeOff, ShieldCheck, Check, X, TrendingUp, Flag, Heart, Smile,
  MessageCircle, Pencil, Flame, Pin, CheckCircle2, Lock, ArrowUp, ChevronDown, Eye, Award
} from 'lucide-react';

interface PostContentRendererProps {
  content: string;
}

export default function PostContentRenderer({ content }: PostContentRendererProps) {
  const [expandedSpoilers, setExpandedSpoilers] = useState<Set<number>>(new Set());

  const toggleSpoiler = (spoilerIdx: number) => {
    setExpandedSpoilers(prev => {
      const next = new Set(prev);
      if (next.has(spoilerIdx)) next.delete(spoilerIdx);
      else next.add(spoilerIdx);
      return next;
    });
  };

  let spoilerCounter = 0;

  return (
    <div className="text-[13px] font-mono text-forum-text/90 leading-relaxed whitespace-pre-wrap flex-1 break-words">
      {content.split('```').map((part, i) => {
        if (i % 2 === 1) {
          const lines = part.split('\n');
          const lang = lines[0];
          const code = lines.slice(1).join('\n');
          return (
            <div
              key={i}
              className="my-3 rounded-md border border-forum-border/40 overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-forum-bg border-b border-forum-border/30">
                <span className="text-[8px] font-mono uppercase tracking-wider text-forum-muted">
                  {lang || 'code'}
                </span>
                <Code size={10} className="text-forum-muted/50" />
              </div>
              <pre className="px-3 py-3 bg-forum-bg/80 overflow-x-auto">
                <code className="text-[11px] font-mono text-forum-pink/80">
                  {code}
                </code>
              </pre>
            </div>
          );
        }

        // Process line by line to detect standalone URLs for embedding
        const lines = part.split('\n');
        const processedLines: JSX.Element[] = [];

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const line = lines[lineIdx];

          // Check if this line is a standalone URL
          if (isStandaloneUrl(line)) {
            const embedData = parseEmbeddableUrl(line.trim());
            if (embedData && embedData.type !== 'link') {
              processedLines.push(
                <div key={`embed-${i}-${lineIdx}`}>
                  <EmbedRenderer embed={embedData} />
                </div>
              );
              continue;
            }
          }

          // Otherwise process the line normally
          processedLines.push(
            <span key={`line-${i}-${lineIdx}`}>
              {lineIdx > 0 && '\n'}
              {processLine(line, spoilerCounter, expandedSpoilers, toggleSpoiler)}
            </span>
          );
        }

        return <span key={i}>{processedLines}</span>;
      })}
    </div>
  );
}

// Helper function to process a single line
function processInlineFormatting(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  // Match bold (**text**), italic (*text*), inline code (`text`), and links [text](url)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    if (match[2]) {
      // Bold
      parts.push(<strong key={`b-${match.index}`} className="font-bold text-forum-text">{match[2]}</strong>);
    } else if (match[3]) {
      // Italic
      parts.push(<em key={`i-${match.index}`} className="italic text-forum-text/80">{match[3]}</em>);
    } else if (match[4]) {
      // Inline code
      parts.push(<code key={`c-${match.index}`} className="px-1 py-0.5 rounded bg-forum-bg border border-forum-border/30 text-forum-pink/80 text-[11px]">{match[4]}</code>);
    } else if (match[5] && match[6]) {
      // Link
      parts.push(<a key={`l-${match.index}`} href={match[6]} target="_blank" rel="noopener noreferrer" className="text-forum-pink hover:underline">{match[5]}</a>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function processLine(line: string, spoilerCounter: number, expandedSpoilers: Set<number>, toggleSpoiler: (idx: number) => void) {
  // Check for headings (# ## ### ####)
  const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const text = headingMatch[2];
    const sizes = ['text-[18px]', 'text-[16px]', 'text-[14px]', 'text-[13px]'];
    return (
      <div className={`${sizes[level - 1]} font-mono font-bold text-forum-text my-2`}>
        {text}
      </div>
    );
  }

  // Check for bullet points (- or *)
  const bulletMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
  if (bulletMatch) {
    return (
      <div className="flex items-start gap-2 my-1">
        <span className="text-forum-pink mt-1">•</span>
        <span className="flex-1">{processInlineFormatting(bulletMatch[1])}</span>
      </div>
    );
  }

  return line.split(/(\[spoiler\][\s\S]*?\[\/spoiler\])/).map((segment, j) => {
    // Handle spoiler tags
    const spoilerMatch = segment.match(/^\[spoiler\]([\s\S]*?)\[\/spoiler\]$/);
    if (spoilerMatch) {
      const currentSpoilerIdx = spoilerCounter++;
      const isExpanded = expandedSpoilers.has(currentSpoilerIdx);
      return (
        <span key={`spoiler-${j}`} className="inline-block my-2">
          <button
            onClick={() => toggleSpoiler(currentSpoilerIdx)}
            className="transition-forum flex items-center gap-1.5 text-[10px] font-mono font-semibold text-forum-pink/80 hover:text-forum-pink bg-forum-pink/[0.04] hover:bg-forum-pink/[0.08] border border-forum-pink/15 hover:border-forum-pink/30 rounded-md px-2.5 py-1.5"
          >
            <EyeOff size={10} />
            {isExpanded ? 'Hide Spoiler' : 'Show Spoiler'}
          </button>
          {isExpanded && (
            <div className="mt-1.5 px-3 py-2 bg-forum-bg/60 border border-forum-border/30 rounded-md text-forum-text/80 animate-in fade-in duration-200">
              {spoilerMatch[1]}
            </div>
          )}
        </span>
      );
    }

    // Check if this segment contains a markdown table
    const tableRegex = /(\n?\|[^\n]+\|\n\|[-:| ]+\|\n(?:\|[^\n]+\|\n?)*)/;
    const tableParts = segment.split(tableRegex);

    return tableParts.map((tPart, tk) => {
      // Render table if it matches
      if (tPart.match(/^\n?\|.+\|\n\|[-:| ]+\|\n/)) {
        const rows = tPart.trim().split('\n').filter(r => r.trim());
        if (rows.length >= 2) {
          const headerCells = rows[0].split('|').filter(c => c.trim());
          const dataRows = rows.slice(2); // skip header + separator
          return (
            <div key={`table-${tk}`} className="my-3 overflow-x-auto rounded-md border border-forum-border/40">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="bg-forum-bg border-b border-forum-border/30">
                    {headerCells.map((cell, ci) => (
                      <th key={ci} className="px-3 py-2 text-left font-bold text-forum-pink/80 uppercase tracking-wider text-[9px]">
                        {cell.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, ri) => {
                    const cells = row.split('|').filter(c => c.trim());
                    return (
                      <tr key={ri} className="border-b border-forum-border/15 last:border-b-0 hover:bg-forum-pink/[0.02] transition-forum">
                        {cells.map((cell, ci) => (
                          <td key={ci} className="px-3 py-1.5 text-forum-text/80">
                            {cell.trim()}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }
      }

      // Process inline formatting: inline code, images, mentions, strikethrough, hashtags, bullets, icons
      return tPart.split(/(!\[.*?\]\(.*?\))|(@\w+)|(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(~~[^~]+~~)|(^#{1,6}\s+.+$)|(^[-*]\s+.+$)|(\[[A-Z][a-zA-Z]+\])/m).map((seg, sj) => {
        if (!seg) return null;

        // Render inline images from markdown ![alt](url)
        const imgMatch = seg.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          return (
            <div key={`${tk}-${sj}`} className="my-2">
              <img
                src={imgMatch[2]}
                alt={imgMatch[1]}
                className="max-w-full max-h-[400px] rounded-md border border-forum-border/30 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          );
        }

        // Hashtags (markdown headers)
        const headerMatch = seg.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const text = headerMatch[2];
          const sizes = ['text-[16px]', 'text-[15px]', 'text-[14px]', 'text-[13px]', 'text-[12px]', 'text-[11px]'];
          return (
            <div key={`${tk}-${sj}`} className={`${sizes[level - 1]} font-bold text-forum-text my-2`}>
              {text}
            </div>
          );
        }

        // Bullet points
        const bulletMatch = seg.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
          return (
            <div key={`${tk}-${sj}`} className="flex items-start gap-2 my-1">
              <span className="text-forum-pink mt-1">•</span>
              <span>{bulletMatch[1]}</span>
            </div>
          );
        }

        // Mentions
        if (seg.startsWith('@')) {
          return (
            <span
              key={`${tk}-${sj}`}
              className="text-forum-pink font-semibold cursor-pointer hover:underline"
            >
              {seg}
            </span>
          );
        }

        // Inline code
        const inlineCodeMatch = seg.match(/^`([^`]+)`$/);
        if (inlineCodeMatch) {
          return (
            <code
              key={`${tk}-${sj}`}
              className="px-1.5 py-0.5 rounded bg-forum-bg border border-forum-border/30 text-[11px] text-forum-pink/90 font-mono"
            >
              {inlineCodeMatch[1]}
            </code>
          );
        }

        // Bold
        const boldMatch = seg.match(/^\*\*([^*]+)\*\*$/);
        if (boldMatch) {
          return <strong key={`${tk}-${sj}`} className="font-bold text-forum-text">{boldMatch[1]}</strong>;
        }

        // Italic
        const italicMatch = seg.match(/^\*([^*]+)\*$/);
        if (italicMatch) {
          return <em key={`${tk}-${sj}`} className="italic">{italicMatch[1]}</em>;
        }

        // Strikethrough
        const strikeMatch = seg.match(/^~~([^~]+)~~$/);
        if (strikeMatch) {
          return <del key={`${tk}-${sj}`} className="text-forum-muted/60">{strikeMatch[1]}</del>;
        }

        // Lucide Icons [IconName]
        const iconMatch = seg.match(/^\[([A-Z][a-zA-Z]+)\]$/);
        if (iconMatch) {
          const iconName = iconMatch[1];
          const iconMap: Record<string, any> = {
            Shield: ShieldCheck,
            Check,
            X,
            Rocket: TrendingUp,
            Sparkles: TrendingUp,
            Flag,
            Heart,
            Smile,
            TrendingUp,
            Lightbulb: MessageCircle,
            FileEdit: Pencil,
            Target: Flag,
            Flame,
            Pin,
            CheckCircle: CheckCircle2,
            Lock,
            ArrowUp,
            ArrowDown: ChevronDown,
            Globe: Eye,
            PartyPopper: Award,
          };
          const IconComponent = iconMap[iconName];
          if (IconComponent) {
            return (
              <IconComponent
                key={`${tk}-${sj}`}
                size={14}
                className="inline-block mx-0.5 text-forum-pink align-text-bottom"
              />
            );
          }
        }

        return seg;
      });
    });
  });
}
