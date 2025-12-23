export function isAdminUser(email?: string | null) {
  if (!email) return false;
  const allowlist = process.env.APP_ADMIN_EMAILS?.split(',').map((v) => v.trim().toLowerCase()) ?? [];
  return allowlist.includes(email.toLowerCase());
}

export async function ensureAdminProfile(userId: string, email?: string | null) {
  if (!isAdminUser(email)) return;
  const { getServiceRoleClient } = await import('@/lib/supabase/admin');
  const supabase = getServiceRoleClient();
  await supabase.from('profiles').upsert({ id: userId, display_name: email ?? userId, role: 'admin' });
}
