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

    const followupPath = challenge.completion_path && challenge.completion_path.length > 0
      ? challenge.completion_path
      : null;

    const cutoff = addDays(new Date(challenge.end_date), 7);
    if (new Date() > cutoff) {
      return { status: 'error', message: 'This challenge completion window has closed.' };
    }

    const { data: existingRows, error: existingError } = await service
      .from('submissions')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const existing = existingRows?.[0] ?? null;

    if (existingError) {
      return { status: 'error', message: 'Could not fetch your existing completion.' };
    }

    if (completed) {
      let submissionId = existing?.id;

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

        submissionId = inserted.id;
      } else {
        const { error: updateError } = await service
          .from('submissions')
          .update({
            status: 'auto_approved',
            points_awarded: challenge.base_points,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          return { status: 'error', message: 'Could not update your completion status.' };
        }
      }

      const { error: clearLedgerError } = await service
        .from('points_ledger')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .eq('reason', 'self_report');

      if (clearLedgerError) {
        return { status: 'error', message: 'Completion saved, but points could not be refreshed.' };
      }

      const { error: ledgerError } = await service.from('points_ledger').insert({
        submission_id: submissionId!,
        user_id: user.id,
        challenge_id: challengeId,
        points: challenge.base_points,
        reason: 'self_report'
      });

      if (ledgerError) {
        return { status: 'error', message: 'Completion saved, but points were not recorded.' };
      }
    } else if (existing) {
      const { error: deleteLedgerError } = await service
        .from('points_ledger')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .eq('reason', 'self_report');

      if (deleteLedgerError) {
        return { status: 'error', message: 'Could not remove points for this completion.' };
      }

      const { error: deleteSubmissionError } = await service.from('submissions').delete().eq('id', existing.id);
      if (deleteSubmissionError) {
        return { status: 'error', message: 'Could not remove completion.' };
      }
    }

    revalidatePath('/');
    if (followupPath) {
      revalidatePath(followupPath);
      if (followupPath !== '/dashboard') {
        revalidatePath('/dashboard');
      }
    } else {
      revalidatePath('/dashboard');
    }
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

  const { data: activeChallenges, error: activeChallengesError } = await supabase
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
        completion_path?: string | null;
      }>
    >();

  if (activeChallengesError) {
    console.error('Failed to load active challenges', { error: activeChallengesError });
  }

  const { data: upcomingChallenges, error: upcomingChallengesError } = await supabase
    .from('challenges')
    .select('*')
    .gt('start_at', nowIso)
    .order('start_at', { ascending: true })
    .limit(5);

  if (upcomingChallengesError) {
    console.error('Failed to load upcoming challenges', { error: upcomingChallengesError });
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (submissionsError) {
    console.error('Failed to load submissions', { error: submissionsError });
  }

  const { data: pastChallenges, error: pastChallengesError } = await supabase
    .from('challenges')
    .select('*')
    .lt('end_date', today)
    .order('start_at', { ascending: false })
    .limit(8);

  if (pastChallengesError) {
    console.error('Failed to load past challenges', { error: pastChallengesError });
  }

  const activeChallengeList = activeChallengesError ? [] : activeChallenges ?? [];
  const upcomingChallengeList = upcomingChallengesError ? [] : upcomingChallenges ?? [];
  const submissionList = submissionsError ? [] : submissions ?? [];
  const pastChallengeList = pastChallengesError ? [] : pastChallenges ?? [];
  const primaryActiveChallenge = activeChallengeList[0];

  const challengeLookup = Object.fromEntries(
    [...activeChallengeList, ...pastChallengeList, ...upcomingChallengeList].map((challenge) => [
      challenge.id,
      challenge
    ])
  );

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

          {activeChallengesError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800 shadow-sm">
              We could not load active challenges right now. Please try again soon.
            </div>
          ) : activeChallengeList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
              No active challenges right now.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {activeChallengeList.map((challenge) => {
                const submission = submissionList.find((entry) => entry.challenge_id === challenge.id);
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
            {submissionsError ? (
              <p className="text-sm text-amber-800">We could not load your submissions right now. Please try again soon.</p>
            ) : (
              <SubmissionList submissions={submissionList} challengeLookup={challengeLookup} />
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">Your progress</h2>
            {submissionsError || pastChallengesError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 shadow-sm">
                We could not load your progress details right now. Please try again soon.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-emerald-700">Accomplished</h3>
                <SubmissionList
                  submissions={submissionList.filter((submission) =>
                    ['approved', 'auto_approved'].includes(submission.status)
                  )}
                  challengeLookup={challengeLookup}
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-rose-700">Failed / missed</h3>
                <SubmissionList
                  submissions={pastChallengeList
                    .map((challenge) => {
                      const submission = submissionList.find((entry) => entry.challenge_id === challenge.id);
                      const beyondGrace = new Date() > addDays(new Date(challenge.end_date), 7);

                      if (submission && ['approved', 'auto_approved'].includes(submission.status)) {
                        return null;
                      }

                      if (!beyondGrace) return null;

                      return (
                        submission ?? {
                          id: `${challenge.id}-missed`,
                          challenge_id: challenge.id,
                          status: 'rejected',
                          created_at: challenge.end_date,
                          points_awarded: 0
                        }
                      );
                    })
                    .filter(Boolean)}
                  challengeLookup={challengeLookup}
                />
              </div>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Upcoming challenges</h2>
          {upcomingChallengesError ? (
            <p className="mt-2 text-sm text-amber-800">We could not load upcoming challenges right now. Please try again soon.</p>
          ) : upcomingChallengeList.length > 0 ? (
            <ul className="mt-3 space-y-3 text-sm text-slate-700">
              {upcomingChallengeList.map((challenge) => (
                <li key={challenge.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="font-semibold text-slate-900">{challenge.title}</div>
                  <div className="text-xs text-slate-600">
                    Starts {format(new Date(challenge.start_at ?? challenge.start_date), 'MMM d')} · {challenge.base_points} pts
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">No upcoming challenges scheduled.</p>
          )}
        </div>
      </section>
    </div>
  );
}
