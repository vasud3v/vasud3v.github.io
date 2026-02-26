/**
 * Example usage of error handling utilities
 * This file demonstrates how to use ForumError, handleSupabaseError, and withRetry
 */

import { supabase, ForumError, handleSupabaseError, withRetry } from './supabase';

// ============================================================================
// Example 1: Basic error handling with handleSupabaseError
// ============================================================================

export async function exampleFetchWithErrorHandling() {
  try {
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .limit(10);

    if (error) {
      throw handleSupabaseError(error, 'fetchThreads');
    }

    return data;
  } catch (error) {
    if (error instanceof ForumError) {
      console.error(`Error code: ${error.code}`);
      console.error(`User message: ${error.userMessage}`);
      console.error(`Retryable: ${error.retryable}`);
    }
    throw error;
  }
}

// ============================================================================
// Example 2: Using withRetry for automatic retry with exponential backoff
// ============================================================================

export async function exampleFetchWithRetry() {
  return withRetry(
    async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error) {
        throw handleSupabaseError(error, 'fetchCategories');
      }

      return data;
    },
    3, // maxRetries
    1000 // initial delay in ms
  );
}

// ============================================================================
// Example 3: Creating custom ForumError
// ============================================================================

export function exampleCustomError() {
  throw new ForumError(
    'Validation failed: title is required',
    'VALIDATION_ERROR',
    'Please provide a title for your thread.',
    false // not retryable
  );
}

// ============================================================================
// Example 4: Error handling in ForumContext operations
// ============================================================================

export async function exampleContextOperation(
  setError: (key: string, error: ForumError, operation: string) => void
) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({ 
        content: 'Test post',
        thread_id: 't1',
        author_id: 'u1'
      });

    if (error) {
      throw handleSupabaseError(error, 'createPost');
    }

    return data;
  } catch (error) {
    if (error instanceof ForumError) {
      // Set error in context for UI display
      setError('createPost', error, 'createPost');
    }
    throw error;
  }
}

// ============================================================================
// Example 5: Optimistic update with error rollback
// ============================================================================

export async function exampleOptimisticUpdate(
  optimisticUpdate: () => void,
  rollback: () => void,
  setError: (key: string, error: ForumError, operation: string) => void
) {
  // Apply optimistic update immediately
  optimisticUpdate();

  try {
    // Attempt the actual operation
    const { error } = await supabase
      .from('thread_votes')
      .upsert({ thread_id: 't1', user_id: 'u1', direction: 'up' });

    if (error) {
      throw handleSupabaseError(error, 'voteThread');
    }
  } catch (error) {
    // Rollback optimistic update on failure
    rollback();

    if (error instanceof ForumError) {
      setError('voteThread', error, 'voteThread');
    }

    throw error;
  }
}
