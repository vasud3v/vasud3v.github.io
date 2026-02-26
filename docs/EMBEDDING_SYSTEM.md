# Forum Post Embedding System

## Overview
The embedding system automatically detects and renders rich embeds for URLs posted in forum threads.

## Supported Services

### YouTube
- Detects: `youtube.com/watch?v=VIDEO_ID` and `youtu.be/VIDEO_ID`
- Renders: Embedded video player with full controls

### Twitter/X
- Detects: `twitter.com` and `x.com` URLs
- Renders: Link to view tweet (full embed requires Twitter API)

### GitHub
- Detects: `github.com` URLs
- Renders: Formatted link preview

### CodePen
- Detects: `codepen.io/USER/pen/PEN_ID`
- Renders: Embedded CodePen with live preview

## Usage

Simply paste a URL on its own line in a post:

```
Check out this video:

https://www.youtube.com/watch?v=dQw4w9WgXcQ

It's really cool!
```

The URL will automatically be detected and rendered as an embed.

## Implementation Details

### Files Created
1. `src/lib/embed-parser.ts` - URL detection and parsing logic
2. `src/components/forum/EmbedRenderer.tsx` - Embed rendering components
3. Updated `src/components/forum/ThreadDetailPage.tsx` - Integrated embed detection into post rendering

### How It Works
1. Post content is split by code blocks (```)
2. Each non-code section is processed line by line
3. Lines matching standalone URL pattern are checked for embeddable services
4. If a match is found, the appropriate embed component is rendered
5. Other lines are processed normally with markdown formatting

### Adding New Services
To add support for a new service:

1. Add detection logic in `src/lib/embed-parser.ts`:
```typescript
if (urlObj.hostname.includes('service.com')) {
  return { type: 'service', url, id: extractedId };
}
```

2. Add embed component in `src/components/forum/EmbedRenderer.tsx`:
```typescript
case 'service':
  return <ServiceEmbed url={embed.url} />;
```

3. Create the embed component following the existing patterns

## Testing

To test the embedding system:

1. Create a new post or reply
2. Paste a YouTube URL on its own line: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Submit the post
4. The URL should render as an embedded video player

## Notes

- URLs must be on their own line to be auto-embedded
- URLs within sentences will remain as regular links
- Code blocks are not processed for embeds
- The system is designed to be extensible for future services
