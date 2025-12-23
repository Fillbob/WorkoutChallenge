'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';

export function SignInButton() {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } });
    setLoading(false);
  };

  return (
    <button
      onClick={signIn}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
      disabled={loading}
    >
      {loading ? 'Redirecting…' : 'Sign in with Google'}
    </button>
  );
}
