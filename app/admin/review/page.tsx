import Image from 'next/image';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';

async function approve(formData: FormData) {
  'use server';
  const submissionId = formData.get('submission_id') as string;
  const points = Number(formData.get('points'));
  const server = getServerClient();
  const {
    data: { user }
  } = await server.auth.getUser();
  const supabase = getServiceRoleClient();
  const { data: submission } = await supabase
    .from('submissions')
    .select('user_id, challenge_id')
    .eq('id', submissionId)
    .maybeSingle();

  await supabase
    .from('submissions')
    .update({ status: 'approved', points_awarded: points, reviewed_at: new Date().toISOString() })
    .eq('id', submissionId);
  await supabase.from('points_ledger').insert({
    submission_id: submissionId,
    user_id: submission?.user_id,
    challenge_id: submission?.challenge_id,
    points,
    reason: 'admin_approve'
  });
  await supabase.from('admin_audit').insert({
    admin_user_id: user?.id ?? null,
    action: 'approve',
    target_table: 'submissions',
    target_id: submissionId,
    before: {},
    after: { status: 'approved', points }
  });
  revalidatePath('/admin/review');
}

async function reject(formData: FormData) {
  'use server';
  const submissionId = formData.get('submission_id') as string;
  const server = getServerClient();
  const {
    data: { user }
  } = await server.auth.getUser();
  const supabase = getServiceRoleClient();
  await supabase
    .from('submissions')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId);
  await supabase.from('admin_audit').insert({
    admin_user_id: user?.id ?? null,
    action: 'reject',
    target_table: 'submissions',
    target_id: submissionId,
    before: {},
    after: { status: 'rejected' }
  });
  revalidatePath('/admin/review');
}

async function requestResubmission(formData: FormData) {
  'use server';
  const submissionId = formData.get('submission_id') as string;
  const server = getServerClient();
  const {
    data: { user }
  } = await server.auth.getUser();
  const supabase = getServiceRoleClient();
  await supabase
    .from('submissions')
    .update({ status: 'resubmitted', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId);
  await supabase.from('admin_audit').insert({
    admin_user_id: user?.id ?? null,
    action: 'request_resubmission',
    target_table: 'submissions',
    target_id: submissionId,
    before: {},
    after: { status: 'resubmitted' }
  });
  revalidatePath('/admin/review');
}

export default async function ReviewPage() {
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && isAdminUser(user.email)) {
    const { ensureAdminProfile } = await import('@/lib/admin');
    await ensureAdminProfile(user.id, user.email);
  } else {
    redirect('/admin');
  }

  const service = getServiceRoleClient();
  const { data: submissions } = await service
    .from('submissions')
    .select('*, profiles(display_name), challenges(title, base_points), submission_images(*)')
    .in('status', ['needs_review', 'resubmitted'])
    .order('created_at', { ascending: true });

  const submissionsWithUrls = await Promise.all(
    (submissions ?? []).map(async (submission) => {
      const { data: signed } = await service.storage
        .from('submission-proofs')
        .createSignedUrls(submission.submission_images.map((img: any) => img.storage_path), 60 * 60);
      return {
        ...submission,
        signedUrls: signed
      };
    })
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Admin review</h1>
      <p className="text-sm text-slate-600">Approve, reject, or request resubmission. Actions are logged.</p>

      <div className="space-y-4">
        {submissionsWithUrls.map((submission) => (
          <div key={submission.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase text-slate-500">{submission.challenges?.title}</p>
                <p className="text-lg font-semibold text-slate-900">{submission.profiles?.display_name}</p>
                <p className="text-sm text-slate-600">AI: {submission.ai_verdict ?? 'pending'} (conf {submission.ai_confidence ?? 0})</p>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p>Points suggested: {submission.challenges?.base_points}</p>
                <p>Status: {submission.status}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {submission.signedUrls?.map((file: any) => (
                <div key={file.path} className="relative h-32 w-32 overflow-hidden rounded-lg border border-slate-200">
                  <Image src={file.signedUrl} alt="Proof" fill className="object-cover" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <form action={approve} className="flex items-center gap-2">
                <input type="hidden" name="submission_id" value={submission.id} />
                <input
                  type="number"
                  name="points"
                  defaultValue={submission.challenges?.base_points ?? 0}
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1"
                />
                <button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white shadow" type="submit">
                  Approve
                </button>
              </form>
              <form action={reject}>
                <input type="hidden" name="submission_id" value={submission.id} />
                <button className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white shadow" type="submit">
                  Reject
                </button>
              </form>
              <form action={requestResubmission}>
                <input type="hidden" name="submission_id" value={submission.id} />
                <button className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white shadow" type="submit">
                  Request resubmission
                </button>
              </form>
            </div>
          </div>
        ))}
        {submissionsWithUrls.length === 0 && <p className="text-sm text-slate-600">No submissions need review.</p>}
      </div>
    </div>
  );
}
