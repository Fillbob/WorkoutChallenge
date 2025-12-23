import { redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { getServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';

export default async function AdminReviewPage() {
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.email)) {
    redirect('/admin');
  }

  const service = getServiceRoleClient();
  const { data: submissions } = await service
    .from('submissions')
    .select('*, profiles(display_name), challenges(title, week_index)')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase text-slate-500">Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900">Completion log</h1>
          <p className="text-sm text-slate-600">Self-reported completions for each challenge.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {submissions?.length === 0 && <p className="text-sm text-slate-600">No completions yet.</p>}
        <ul className="divide-y divide-slate-100">
          {(submissions ?? []).map((submission) => (
            <li key={submission.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">
                  {submission.profiles?.display_name ?? 'Unknown participant'}
                </p>
                <p className="text-slate-600">
                  Week {submission.challenges?.week_index ?? 'N/A'}: {submission.challenges?.title ?? 'Unknown challenge'}
                </p>
                <p className="text-xs uppercase text-slate-500">{submission.status}</p>
              </div>
              <div className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
