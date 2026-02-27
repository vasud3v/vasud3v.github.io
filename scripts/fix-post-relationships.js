/**
 * Fix Post Relationships for Threaded View
 * 
 * This script analyzes existing posts and sets up reply_to relationships
 * based on:
 * 1. Quoted content (posts that quote other posts)
 * 2. Chronological order (replies after original posts)
 * 3. Thread structure
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Extract quoted username from post content
 */
function extractQuotedUsername(content) {
  const quoteMatch = content.match(/>\s*\*\*@(\w+)\*\*\s*wrote:/);
  return quoteMatch ? quoteMatch[1] : null;
}

/**
 * Fix relationships for a single thread
 */
async function fixThreadRelationships(threadId, threadTitle) {
  console.log(`\n📝 Processing thread: ${threadTitle}`);
  
  // Get all posts in this thread, ordered by creation time
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      reply_to,
      author:forum_users!posts_author_id_fkey(id, username)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`❌ Error fetching posts:`, error);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log('   No posts found');
    return;
  }

  console.log(`   Found ${posts.length} posts`);

  let updatedCount = 0;
  const postsByUsername = {};
  
  // Build username to post ID mapping
  posts.forEach(post => {
    if (post.author?.username) {
      if (!postsByUsername[post.author.username]) {
        postsByUsername[post.author.username] = [];
      }
      postsByUsername[post.author.username].push(post);
    }
  });

  // Process each post
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    
    // Skip if already has reply_to set
    if (post.reply_to) {
      console.log(`   ✓ Post ${i + 1} already has reply_to set`);
      continue;
    }

    // Skip the first post (original post)
    if (i === 0) {
      console.log(`   ✓ Post ${i + 1} is the original post (no parent)`);
      continue;
    }

    let parentPostId = null;

    // Strategy 1: Check if post quotes another user
    const quotedUsername = extractQuotedUsername(post.content);
    if (quotedUsername && postsByUsername[quotedUsername]) {
      // Find the most recent post by that user before this post
      const candidatePosts = postsByUsername[quotedUsername].filter(p => 
        new Date(p.created_at) < new Date(post.created_at)
      );
      
      if (candidatePosts.length > 0) {
        // Use the most recent post by that user
        parentPostId = candidatePosts[candidatePosts.length - 1].id;
        console.log(`   → Post ${i + 1} quotes @${quotedUsername}, linking to their post`);
      }
    }

    // Strategy 2: If no quote found, link to the previous post
    if (!parentPostId && i > 0) {
      parentPostId = posts[i - 1].id;
      console.log(`   → Post ${i + 1} linked to previous post (chronological)`);
    }

    // Update the post with reply_to
    if (parentPostId) {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ reply_to: parentPostId })
        .eq('id', post.id);

      if (updateError) {
        console.error(`   ❌ Error updating post ${i + 1}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`   ✅ Updated ${updatedCount} posts with reply_to relationships`);
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Fixing Post Relationships for Threaded View\n');
  console.log('This will analyze existing posts and set up parent-child relationships.');
  console.log('Posts that quote other users will be linked to those posts.');
  console.log('Other posts will be linked chronologically.\n');

  // Get all threads
  const { data: threads, error: threadsError } = await supabase
    .from('threads')
    .select('id, title, reply_count')
    .order('created_at', { ascending: false });

  if (threadsError) {
    console.error('❌ Error fetching threads:', threadsError);
    process.exit(1);
  }

  if (!threads || threads.length === 0) {
    console.log('No threads found.');
    process.exit(0);
  }

  console.log(`Found ${threads.length} threads to process\n`);

  // Process each thread
  for (const thread of threads) {
    if (thread.reply_count > 0) {
      await fixThreadRelationships(thread.id, thread.title);
    }
  }

  console.log('\n✅ Done! All post relationships have been fixed.');
  console.log('\n💡 Now try switching to Threaded view in the forum to see nested replies!');
}

main().catch(console.error);
