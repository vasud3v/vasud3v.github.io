// URL Embedding Parser for Forum Posts
// Detects and generates embed components for various services

export interface EmbedData {
  type: 'youtube' | 'twitter' | 'github' | 'codepen' | 'link';
  url: string;
  id?: string;
  title?: string;
}

/**
 * Detects if a URL is embeddable and returns embed data
 */
export function parseEmbeddableUrl(url: string): EmbedData | null {
  try {
    const urlObj = new URL(url);
    
    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId: string | null = null;
      
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.searchParams.has('v')) {
        videoId = urlObj.searchParams.get('v');
      }
      
      if (videoId) {
        return { type: 'youtube', url, id: videoId };
      }
    }
    
    // Twitter/X
    if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
      return { type: 'twitter', url };
    }
    
    // GitHub
    if (urlObj.hostname.includes('github.com')) {
      return { type: 'github', url };
    }
    
    // CodePen
    if (urlObj.hostname.includes('codepen.io')) {
      return { type: 'codepen', url };
    }
    
    // Generic link
    return { type: 'link', url };
  } catch {
    return null;
  }
}

/**
 * Extracts all URLs from text content
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
  return text.match(urlRegex) || [];
}

/**
 * Checks if a line is a standalone URL (for auto-embedding)
 */
export function isStandaloneUrl(line: string): boolean {
  const trimmed = line.trim();
  const urlRegex = /^https?:\/\/[^\s<>"{}|\\^`\[\]]+$/i;
  return urlRegex.test(trimmed);
}
