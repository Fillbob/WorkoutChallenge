import Link from 'next/link';
import { getServerClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';

export default async function AdminHomePage() {
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && isAdminUser(user.email)) {
    // ensure DB role is aligned
    const { ensureAdminProfile } = await import('@/lib/admin');
    await ensureAdminProfile(user.id, user.email);
  }

  if (!user || !isAdminUser(user.email)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          Admin access required. Please sign in with an approved email.
        </div>
      </div>
    );
  }

  const { data: pending } = await supabase
    .from('submissions')
    .select('id')
    .in('status', ['needs_review', 'resubmitted']);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900">Review queue</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold text-primary">
          <Link href="/admin/review">Review submissions</Link>
          <Link href="/admin/challenges">Manage challenges</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Pending review</p>
          <p className="text-3xl font-bold text-slate-900">{pending?.length ?? 0}</p>
          <p className="text-sm text-slate-600">Submissions awaiting manual decision.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Policies</p>
          <p className="text-sm text-slate-700">
            Photos stay private; only uploader and admins can view. All admin actions are logged to the audit table.
          </p>
        </div>
      </div>
    </div>
  );
}
