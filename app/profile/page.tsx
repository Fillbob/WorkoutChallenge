import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function updateProfile(formData: FormData) {
  'use server';
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/dashboard');

  const nickname = formData.get('nickname') as string;
  await supabase.from('profiles').upsert({ id: user.id, nickname });
  revalidatePath('/profile');
}

async function createTeam(formData: FormData) {
  'use server';
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/dashboard');

  const name = formData.get('team_name') as string;
  const joinCode = crypto.randomUUID().slice(0, 6).toUpperCase();
  const { data: team, error } = await supabase
    .from('teams')
    .insert({ name, join_code: joinCode, created_by: user.id })
    .select('*')
    .maybeSingle();
  if (error || !team) throw error ?? new Error('Could not create team');
  await supabase.from('team_members').insert({ team_id: team.id, user_id: user.id, role: 'owner' });
  revalidatePath('/profile');
}

async function joinTeam(formData: FormData) {
  'use server';
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/dashboard');

  const code = (formData.get('join_code') as string)?.trim();
  const { data: team } = await supabase.from('teams').select('*').eq('join_code', code).maybeSingle();
  if (team) {
    await supabase.from('team_members').upsert({ team_id: team.id, user_id: user.id, role: 'member' });
  }
  revalidatePath('/profile');
}

export default async function ProfilePage() {
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dashboard');
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*, team_members(team_id, teams(name, join_code))')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const { data: created } = await supabase
      .from('profiles')
      .upsert({ id: user.id, display_name: user.user_metadata?.full_name ?? user.email ?? 'Participant' })
      .select('*, team_members(team_id, teams(name, join_code))')
      .maybeSingle();
    profile = created ?? null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-slate-600">Update your display details and join a team.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={updateProfile} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Display</h2>
          <div className="space-y-1 text-sm">
            <label className="font-medium text-slate-800" htmlFor="nickname">
              Nickname (optional)
            </label>
            <input
              id="nickname"
              name="nickname"
              defaultValue={profile?.nickname ?? ''}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Coach, Runner, etc."
            />
            <p className="text-xs text-slate-500">Display name defaults to your Google name. Nickname shows publicly.</p>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
          >
            Save profile
          </button>
        </form>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Team</h2>
          {profile?.team_members?.[0]?.teams ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">{profile.team_members[0].teams.name}</p>
              <p className="text-slate-600">Join code: {profile.team_members[0].teams.join_code}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">You are not on a team yet.</p>
          )}

          <form action={createTeam} className="space-y-3 text-sm">
            <label className="font-medium text-slate-800" htmlFor="team_name">
              Create team
            </label>
            <input
              id="team_name"
              name="team_name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Team Grit"
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm"
            >
              Create
            </button>
          </form>

          <form action={joinTeam} className="space-y-3 text-sm">
            <label className="font-medium text-slate-800" htmlFor="join_code">
              Join by code
            </label>
            <input
              id="join_code"
              name="join_code"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="ABC123"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
            >
              Join team
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
