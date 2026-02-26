import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    username?: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// Helper: Mark user as online (forum_users record is created by DB trigger)
// ============================================================================

async function markUserOnline(authUser: User) {
  try {
    // The forum_users record should be created automatically by the database trigger
    // when the user signs up. Here we just mark them as online.
    // Use a small delay to ensure the trigger has completed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // First check if the record exists
    const { data: existingUser } = await supabase
      .from('forum_users')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();
    
    // Only update if the record exists
    if (existingUser) {
      const { error } = await supabase
        .from('forum_users')
        .update({ is_online: true, updated_at: new Date().toISOString() })
        .eq('id', authUser.id);

      if (error) {
        console.warn('[AuthContext] Failed to mark user online:', error.message);
      }
    } else {
      console.warn('[AuthContext] forum_users record not found for user:', authUser.id);
      console.warn('[AuthContext] The database trigger should have created this record automatically');
    }
  } catch (err) {
    console.warn('[AuthContext] markUserOnline error:', err);
  }
}

async function markUserOffline(userId: string) {
  try {
    await supabase
      .from('forum_users')
      .update({ is_online: false, updated_at: new Date().toISOString() })
      .eq('id', userId);
  } catch (err) {
    console.warn('markUserOffline error:', err);
  }
}

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Mark user as online (forum_users record created by DB trigger)
      if (session?.user) {
        markUserOnline(session.user);
      }
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        markUserOnline(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email/password
  const signUp = useCallback(
    async (email: string, password: string, username?: string) => {
      const resolvedUsername = username || email.split('@')[0];

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: resolvedUsername,
          },
        },
      });

      // If signup succeeded and we have a user, mark them as online
      // (forum_users record is created automatically by DB trigger)
      if (!error && data.user) {
        await markUserOnline(data.user);
      }

      return { error };
    },
    []
  );

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    // Mark user offline before signing out
    if (user?.id) {
      await markUserOffline(user.id);
    }
    await supabase.auth.signOut();
  }, [user?.id]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
