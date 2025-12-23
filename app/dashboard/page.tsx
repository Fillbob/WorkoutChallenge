import Link from 'next/link';
import { addDays, format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { SignInButton } from '@/components/sign-in-button';
import { getServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/admin';
import { ChallengeCard } from '@/components/challenge-card';
import { SubmissionList } from '@/components/submission-list';
import { ChallengeCompletionForm, type CompletionFormState } from '@/components/challenge-completion-form';

async function toggleCompletion(_: CompletionFormState, formData: FormData): Promise<CompletionFormState> {
  'use server';

  const challengeId = formData.get('challenge_id') as string;
  const completed = formData.get('completed') === 'on';

  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !challengeId) {
    return { status: 'error', message: 'You must be signed in to update a completion.' };
  }

  try {
    const service = getServiceRoleClient();
    const { data: challenge, error: challengeError } = await service
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .maybeSingle();

    if (challengeError || !challenge) {
      return { status: 'error', message: 'Challenge not found or unavailable.' };
    }

    const cutoff = addDays(new Date(challenge.end_date), 7);
    if (new Date() > cutoff) {
      return { status: 'error', message: 'This challenge completion window has closed.' };
    }

    const { data: existing, error: existingError } = await service
      .from('submissions')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError) {
      return { status: 'error', message: 'Could not fetch your existing completion.' };
    }

    if (completed) {
      if (!existing) {
        const { data: inserted, error: insertError } = await service
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

        if (insertError || !inserted) {
          return { status: 'error', message: 'Could not save your completion.' };
        }

        const { error: ledgerError } = await service.from('points_ledger').insert({
          submission_id: inserted.id,
          user_id: user.id,
          challenge_id: challengeId,
          points: challenge.base_points,
          reason: 'self_report'
        });

        if (ledgerError) {
          return { status: 'error', message: 'Completion saved, but points were not recorded.' };
        }
      }
    } else if (existing && existing.status === 'auto_approved') {
      const { error: deleteLedgerError } = await service
        .from('points_ledger')
        .delete()
        .eq('submission_id', existing.id)
        .eq('reason', 'self_report');

      if (deleteLedgerError) {
        return { status: 'error', message: 'Could not remove points for this completion.' };
      }

      const { error: deleteSubmissionError } = await service.from('submissions').delete().eq('id', existing.id);
      if (deleteSubmissionError) {
        return { status: 'error', message: 'Could not remove completion.' };
      }
    }

    revalidatePath('/dashboard');
    return { status: 'success', message: 'Saved!' };
  } catch (error) {
    console.error('Failed to toggle completion', { error });
    return { status: 'error', message: 'Unexpected error saving completion. Please try again.' };
  }
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

  const now = new Date();
  const nowIso = now.toISOString();
  const today = nowIso.split('T')[0];

  const { data: activeChallenges } = await supabase
    .from('challenges')
    .select('*')
    .lte('start_at', nowIso)
    .gte('end_date', today)
    .order('start_at', { ascending: false })
    .returns<
      Array<{
        id: string;
        title: string;
        description: string;
        start_at: string;
        start_date?: string;
        end_date: string;
        base_points: number;
      }>
    >();

  const { data: upcomingChallenge } = await supabase
    .from('challenges')
    .select('*')
    .gt('start_at', nowIso)
    .order('start_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const activeChallengeList = activeChallenges ?? [];
  const primaryActiveChallenge = activeChallengeList[0];

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
          <div>
            <h2 className="text-lg font-semibold">Active challenges</h2>
            <p className="text-sm text-slate-600">
              Check off any active challenges you have completed while their completion window is still open.
            </p>
          </div>

          {activeChallengeList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
              No active challenges right now.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {activeChallengeList.map((challenge) => {
                const submission = submissions?.find((entry) => entry.challenge_id === challenge.id);
                const completionDisabled = new Date() > addDays(new Date(challenge.end_date), 7);

                return (
                  <ChallengeCompletionForm
                    key={challenge.id}
                    challenge={challenge}
                    defaultCompleted={Boolean(submission)}
                    disabled={completionDisabled}
                    onSubmitAction={toggleCompletion}
                  />
                );
              })}
            </div>
          )}

          {primaryActiveChallenge && <ChallengeCard challenge={primaryActiveChallenge} emptyMessage="" />}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Weekly submissions</h2>
          <SubmissionList submissions={submissions ?? []} />
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Upcoming challenge</h2>
        <ChallengeCard
          challenge={upcomingChallenge ?? undefined}
          variant="upcoming"
          emptyMessage="No upcoming challenge scheduled yet."
        />
      </section>
    </div>
  );
}
