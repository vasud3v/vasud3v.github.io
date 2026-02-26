import { ExternalLink, Github, Code } from 'lucide-react';
import { EmbedData } from '@/lib/embed-parser';

interface EmbedRendererProps {
  embed: EmbedData;
}

export function EmbedRenderer({ embed }: EmbedRendererProps) {
  switch (embed.type) {
    case 'youtube':
      return <YouTubeEmbed videoId={embed.id!} url={embed.url} />;
    case 'twitter':
      return <TwitterEmbed url={embed.url} />;
    case 'github':
      return <GitHubEmbed url={embed.url} />;
    case 'codepen':
      return <CodePenEmbed url={embed.url} />;
    case 'link':
      return <LinkPreview url={embed.url} />;
    default:
      return null;
  }
}

function YouTubeEmbed({ videoId, url }: { videoId: string; url: string }) {
  return (
    <div className="my-3 rounded-md border border-forum-border/40 overflow-hidden bg-forum-bg/50">
      <div className="flex items-center justify-between px-3 py-2 bg-forum-card-alt/30 border-b border-forum-border/20">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-500 flex items-center justify-center">
            <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-[9px] font-mono font-semibold text-forum-text">YouTube Video</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forum-muted hover:text-forum-pink transition-forum"
          title="Open in new tab"
        >
          <ExternalLink size={10} />
        </a>
      </div>
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function TwitterEmbed({ url }: { url: string }) {
  return (
    <div className="my-3 rounded-md border border-forum-border/40 overflow-hidden bg-forum-bg/50">
      <div className="flex items-center justify-between px-3 py-2 bg-forum-card-alt/30 border-b border-forum-border/20">
        <div className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
          <span className="text-[9px] font-mono font-semibold text-forum-text">Twitter/X Post</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forum-muted hover:text-forum-pink transition-forum"
          title="Open in new tab"
        >
          <ExternalLink size={10} />
        </a>
      </div>
      <div className="p-4 text-center">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[11px] font-mono text-forum-pink hover:text-forum-pink/80 transition-forum"
        >
          <ExternalLink size={12} />
          View Tweet on Twitter/X
        </a>
        <p className="mt-2 text-[9px] font-mono text-forum-muted/60">
          Click to view the full post
        </p>
      </div>
    </div>
  );
}

function GitHubEmbed({ url }: { url: string }) {
  return (
    <div className="my-3 rounded-md border border-forum-border/40 overflow-hidden bg-forum-bg/50">
      <div className="flex items-center justify-between px-3 py-2 bg-forum-card-alt/30 border-b border-forum-border/20">
        <div className="flex items-center gap-2">
          <Github size={14} className="text-forum-text" />
          <span className="text-[9px] font-mono font-semibold text-forum-text">GitHub</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forum-muted hover:text-forum-pink transition-forum"
          title="Open in new tab"
        >
          <ExternalLink size={10} />
        </a>
      </div>
      <div className="p-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono text-forum-pink hover:text-forum-pink/80 transition-forum break-all"
        >
          {url}
        </a>
      </div>
    </div>
  );
}

function CodePenEmbed({ url }: { url: string }) {
  // Extract pen ID from URL
  const penMatch = url.match(/codepen\.io\/([^\/]+)\/pen\/([^\/\?]+)/);
  const penId = penMatch ? penMatch[2] : null;
  const username = penMatch ? penMatch[1] : null;

  return (
    <div className="my-3 rounded-md border border-forum-border/40 overflow-hidden bg-forum-bg/50">
      <div className="flex items-center justify-between px-3 py-2 bg-forum-card-alt/30 border-b border-forum-border/20">
        <div className="flex items-center gap-2">
          <Code size={14} className="text-forum-text" />
          <span className="text-[9px] font-mono font-semibold text-forum-text">CodePen</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forum-muted hover:text-forum-pink transition-forum"
          title="Open in new tab"
        >
          <ExternalLink size={10} />
        </a>
      </div>
      {penId && username ? (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://codepen.io/${username}/embed/${penId}?default-tab=result`}
            title="CodePen Embed"
            frameBorder="0"
            loading="lazy"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="p-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-forum-pink hover:text-forum-pink/80 transition-forum break-all"
          >
            {url}
          </a>
        </div>
      )}
    </div>
  );
}

function LinkPreview({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-forum-pink hover:text-forum-pink/80 transition-forum underline decoration-forum-pink/30 hover:decoration-forum-pink/60"
    >
      {url}
      <ExternalLink size={10} />
    </a>
  );
}
