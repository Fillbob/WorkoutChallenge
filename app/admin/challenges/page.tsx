import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';

async function createChallenge(formData: FormData) {
  'use server';
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

  const payload = {
    week_index: Number(formData.get('week_index')),
    title: String(formData.get('title')),
    description: String(formData.get('description')),
    start_at: new Date(String(formData.get('start_at'))).toISOString(),
    start_date: new Date(String(formData.get('start_at'))).toISOString().split('T')[0],
    end_date: String(formData.get('end_date')),
    base_points: Number(formData.get('base_points')),
    bonus_rules: formData.get('bonus_rules') as string,
    stretch_rules: formData.get('stretch_rules') as string,
    created_by: user.id
  };

  await supabase.from('challenges').upsert(payload);
  revalidatePath('/admin/challenges');
}

export default async function ChallengesAdminPage() {
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.email)) {
    redirect('/admin');
  }

  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .order('week_index', { ascending: true });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Challenges</h1>
      </div>

      <form action={createChallenge} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create / update challenge</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-800">
            Week index
            <input name="week_index" type="number" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
          </label>
          <label className="text-sm font-medium text-slate-800">
            Base points
            <input name="base_points" type="number" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
          </label>
        </div>
        <label className="text-sm font-medium text-slate-800">
          Title
          <input name="title" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
        </label>
        <label className="text-sm font-medium text-slate-800">
          Description
          <textarea name="description" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" rows={3} required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-800">
            Start date &amp; time
            <input
              name="start_at"
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-800">
            End date
            <input name="end_date" type="date" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
          </label>
        </div>
        <label className="text-sm font-medium text-slate-800">
          Bonus rules
          <input name="bonus_rules" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-800">
          Stretch goals
          <input name="stretch_rules" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <button
          type="submit"
          className="mt-2 w-fit rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
        >
          Save challenge
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Existing challenges</h2>
        <div className="mt-4 grid gap-3 text-sm">
          {challenges?.map((challenge) => (
            <div key={challenge.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase text-slate-500">Week {challenge.week_index}</p>
                  <p className="text-lg font-semibold text-slate-900">{challenge.title}</p>
                  <p className="text-slate-700">{challenge.description}</p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>Start: {new Date(challenge.start_at ?? challenge.start_date).toLocaleString()}</p>
                  <p>End: {challenge.end_date}</p>
                  <p className="font-semibold text-primary">{challenge.base_points} pts</p>
                </div>
              </div>
            </div>
          ))}
          {(!challenges || challenges.length === 0) && <p className="text-slate-600">No challenges yet.</p>}
        </div>
      </div>
    </div>
  );
}
