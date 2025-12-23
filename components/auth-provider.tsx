'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabase/browser';

interface AuthContextValue {
  supabase: SupabaseClient;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ supabase, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
