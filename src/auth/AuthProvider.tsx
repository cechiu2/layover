import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { syncAuthenticatedCache } from '../data/db';
import { isSupabaseConfigured, supabase } from '../data/supabase';

interface AuthContextValue {
  error: string | null;
  isConfigured: boolean;
  isReady: boolean;
  isSyncing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  user: User | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getSyncErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unable to sync flights';

  if (message.includes("Could not find the table 'public.flights'")) {
    return 'Cloud flight storage is not set up yet. Flights will stay local until the Supabase flights table is created.';
  }

  return message;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(!isSupabaseConfigured);
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let isCancelled = false;

    async function syncUser(nextUser: User | null) {
      setUser(nextUser);
      setError(null);

      if (!nextUser) {
        syncedUserId.current = null;
        setIsReady(true);
        return;
      }

      if (syncedUserId.current === nextUser.id) {
        setIsReady(true);
        return;
      }

      setIsSyncing(true);

      try {
        await syncAuthenticatedCache();
        syncedUserId.current = nextUser.id;
      } catch (syncError) {
        setError(getSyncErrorMessage(syncError));
      } finally {
        if (!isCancelled) {
          setIsReady(true);
          setIsSyncing(false);
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!isCancelled) {
        void syncUser(data.session?.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncUser(session?.user ?? null);
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      error,
      isConfigured: isSupabaseConfigured,
      isReady,
      isSyncing,
      async signIn(email, password) {
        if (!supabase) {
          throw new Error('Supabase is not configured.');
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          throw new Error(signInError.message);
        }
      },
      async signInWithGoogle() {
        if (!supabase) {
          throw new Error('Supabase is not configured.');
        }

        const { error: googleError } = await supabase.auth.signInWithOAuth({
          options: {
            redirectTo: window.location.origin,
          },
          provider: 'google',
        });

        if (googleError) {
          throw new Error(googleError.message);
        }
      },
      async signOut() {
        if (!supabase) {
          return;
        }

        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
          throw new Error(signOutError.message);
        }
      },
      async signUp(email, password) {
        if (!supabase) {
          throw new Error('Supabase is not configured.');
        }

        const { error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
          throw new Error(signUpError.message);
        }
      },
      user,
    }),
    [error, isReady, isSyncing, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return value;
}
