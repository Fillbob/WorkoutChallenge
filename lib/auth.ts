import { getServerClient } from './supabase/server';

export async function getSession() {
  const supabase = getServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  return session;
}

export async function getProfile() {
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return profile;
}

export async function requireAdmin() {
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return profile?.role === 'admin';
}
