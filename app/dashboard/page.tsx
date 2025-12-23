import Link from 'next/link';
import { format } from 'date-fns';
import { SignInButton } from '@/components/sign-in-button';
import { getServerClient } from '@/lib/supabase/server';
import { ChallengeCard } from '@/components/challenge-card';
import { SubmissionList } from '@/components/submission-list';
import { UploadForm } from '@/components/upload-form';

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
          <p className="mt-2 text-slate-600">Sign in with Google to join the challenge and start uploading proof.</p>
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
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString())
    .maybeSingle();

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, submission_images(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

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
              Submit proof before {format(new Date(currentChallenge.end_date), 'PPP')}.
            </p>
          )}
          {currentChallenge && <UploadForm challengeId={currentChallenge.id} />}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Weekly submissions</h2>
          <SubmissionList submissions={submissions ?? []} />
        </div>
      </section>
    </div>
  );
}
