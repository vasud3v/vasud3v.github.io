import { PostData } from '@/types/forum';
import { MAX_THREAD_DEPTH } from './forumConstants';

export interface PostTreeNode {
  post: PostData;
  children: PostTreeNode[];
  depth: number;
}

/**
 * Builds a tree of posts from a flat list using the `replyTo` field.
 * Posts without a `replyTo` (or whose parent is not found) become root-level nodes.
 * Depth is clamped to MAX_THREAD_DEPTH – deeper replies are shown as children
 * of the nearest ancestor at the max depth.
 */
export function buildPostTree(posts: PostData[]): PostTreeNode[] {
  const postMap = new Map<string, PostData>();
  for (const post of posts) {
    postMap.set(post.id, post);
  }

  // Group children by parent ID
  const childrenMap = new Map<string, PostData[]>();
  const roots: PostData[] = [];
  const visited = new Set<string>(); // Track visited posts to detect cycles

  for (const post of posts) {
    // Check for circular references
    if (post.replyTo && post.replyTo === post.id) {
      console.warn(`[buildPostTree] Post ${post.id} has circular self-reference, treating as root`);
      roots.push(post);
      continue;
    }

    if (post.replyTo && postMap.has(post.replyTo)) {
      // Check for immediate circular reference (A->B, B->A)
      const parent = postMap.get(post.replyTo);
      if (parent?.replyTo === post.id) {
        console.warn(`[buildPostTree] Circular reference detected between ${post.id} and ${post.replyTo}, breaking cycle`);
        roots.push(post);
        continue;
      }

      const siblings = childrenMap.get(post.replyTo) || [];
      siblings.push(post);
      childrenMap.set(post.replyTo, siblings);
    } else {
      roots.push(post);
    }
  }

  function buildNode(post: PostData, depth: number, ancestors: Set<string> = new Set()): PostTreeNode {
    // Prevent infinite recursion from cycles
    if (ancestors.has(post.id)) {
      console.warn(`[buildPostTree] Cycle detected at post ${post.id}, stopping recursion`);
      return { post, children: [], depth };
    }

    const effectiveDepth = Math.min(depth, MAX_THREAD_DEPTH);
    const newAncestors = new Set(ancestors);
    newAncestors.add(post.id);

    const children = (childrenMap.get(post.id) || [])
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(child => buildNode(child, effectiveDepth + 1, newAncestors));

    return { post, children, depth: effectiveDepth };
  }

  return roots
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(post => buildNode(post, 0));
}

/**
 * Flattens the tree back to a sorted array (depth-first) for rendering.
 * Each item carries its depth for indentation.
 * Skips children of collapsed nodes.
 */
export function flattenTree(
  tree: PostTreeNode[], 
  collapsedNodes: Set<string> = new Set()
): { post: PostData; depth: number }[] {
  const result: { post: PostData; depth: number }[] = [];

  function walk(nodes: PostTreeNode[]) {
    for (const node of nodes) {
      result.push({ post: node.post, depth: node.depth });
      // Skip children if this node is collapsed
      if (!collapsedNodes.has(node.post.id)) {
        walk(node.children);
      }
    }
  }

  walk(tree);
  return result;
}

/**
 * Returns total count of all descendants (replies) of a post.
 */
export function countDescendants(node: PostTreeNode): number {
  let count = node.children.length;
  for (const child of node.children) {
    count += countDescendants(child);
  }
  return count;
}
