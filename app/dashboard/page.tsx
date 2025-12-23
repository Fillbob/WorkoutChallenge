import Link from 'next/link';
import { addDays, format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { SignInButton } from '@/components/sign-in-button';
import { getServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/admin';
import { ChallengeCard } from '@/components/challenge-card';
import { SubmissionList } from '@/components/submission-list';

async function toggleCompletion(formData: FormData) {
  'use server';

  const challengeId = formData.get('challenge_id') as string;
  const completed = formData.get('completed') === 'on';

  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !challengeId) {
    return;
  }

  const service = getServiceRoleClient();
  const { data: challenge } = await service
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .maybeSingle();

  if (!challenge) {
    return;
  }

  const cutoff = addDays(new Date(challenge.end_date), 7);
  if (new Date() > cutoff) {
    return;
  }

  const { data: existing } = await service
    .from('submissions')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (completed) {
    if (!existing) {
      const { data: inserted } = await service
        .from('submissions')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          status: 'auto_approved',
          points_awarded: challenge.base_points,
          reviewed_at: new Date().toISOString()
        })
        .select('*')
        .maybeSingle();

      if (inserted) {
        await service.from('points_ledger').insert({
          submission_id: inserted.id,
          user_id: user.id,
          challenge_id: challengeId,
          points: challenge.base_points,
          reason: 'self_report'
        });
      }
    }
  } else if (existing && existing.status === 'auto_approved') {
    await service.from('points_ledger').delete().eq('submission_id', existing.id).eq('reason', 'self_report');
    await service.from('submissions').delete().eq('id', existing.id);
  }

  revalidatePath('/dashboard');
}

export default async function DashboardPage() {
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-slate-600">Sign in with Google to join the challenge and track your weekly completion.</p>
          <div className="mt-4">
            <SignInButton />
          </div>
        </div>
      </div>
    );
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const { data: created } = await supabase
      .from('profiles')
      .upsert({ id: user.id, display_name: user.user_metadata?.full_name ?? user.email ?? 'Participant' })
      .select('*')
      .maybeSingle();
    profile = created ?? null;
  }

  const { data: currentChallenge } = await supabase
    .from('challenges')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const currentSubmission = submissions?.find((submission) => submission.challenge_id === currentChallenge?.id);
  const completionDisabled = currentChallenge
    ? new Date() > addDays(new Date(currentChallenge.end_date), 7)
    : true;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Signed in as</p>
          <h1 className="text-2xl font-semibold text-slate-900">{profile?.display_name ?? user.email}</h1>
          {profile?.nickname && <p className="text-slate-600">Nickname: {profile.nickname}</p>}
        </div>
        <Link
          href="/profile"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm"
        >
          Edit profile / team
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Current challenge</h2>
          <ChallengeCard challenge={currentChallenge ?? undefined} />
          {currentChallenge && (
            <p className="text-sm text-slate-600">
              Toggle completion before {format(addDays(new Date(currentChallenge.end_date), 7), 'PPP')}.
            </p>
          )}
          {currentChallenge && (
            <form action={toggleCompletion} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Weekly completion</h3>
              <p className="text-sm text-slate-600">
                Mark this challenge as done. You can change it until one week after the challenge ends.
              </p>
              <input type="hidden" name="challenge_id" value={currentChallenge.id} />
              <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  name="completed"
                  defaultChecked={Boolean(currentSubmission)}
                  disabled={completionDisabled}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                I completed this week&apos;s challenge
              </label>
              {completionDisabled && (
                <p className="mt-2 text-xs text-slate-500">
                  Completion window closed on {format(addDays(new Date(currentChallenge.end_date), 7), 'PPP')}.
                </p>
              )}
              <button
                type="submit"
                disabled={completionDisabled}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Save completion
              </button>
            </form>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Weekly submissions</h2>
          <SubmissionList submissions={submissions ?? []} />
        </div>
      </section>
    </div>
  );
}
