import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';
import { ChallengesManager } from './challenges-manager';

async function ensureAdmin(userEmail?: string | null, userId?: string) {
  if (userEmail && isAdminUser(userEmail)) {
    const { ensureAdminProfile } = await import('@/lib/admin');
    if (userId) {
      await ensureAdminProfile(userId, userEmail);
    }
  } else {
    redirect('/admin');
  }
}

async function upsertChallenge(_: unknown, formData: FormData) {
  'use server';
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  await ensureAdmin(user?.email, user?.id);

  await ensureAdmin(user.email, user.id);

  const payload = {
    id: (formData.get('id') as string) || undefined,
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

  const { error } = await supabase.from('challenges').upsert(payload);

  if (error) {
    console.error('Failed to upsert challenge', {
      context: 'createChallenge',
      error: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      payload
    });
    return {
      status: 'error',
      message: 'Supabase rejected the challenge payload.',
      details: `${error.code ?? 'unknown'}: ${error.message}`
    } as const;
  }

  console.info('Challenge upsert succeeded', {
    context: 'createChallenge',
    payload
  });

  revalidatePath('/admin/challenges', 'page');
  return { status: 'success', message: 'Challenge saved successfully.' } as const;
}

async function deleteChallenge(formData: FormData) {
  'use server';
  const supabase = getServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  await ensureAdmin(user?.email, user?.id);

  const challengeId = formData.get('id') as string | null;
  if (!challengeId) return;

  await supabase.from('challenges').delete().eq('id', challengeId);
  revalidatePath('/admin/challenges', 'page');
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

      <ChallengesManager challenges={challenges ?? []} upsertAction={upsertChallenge} deleteAction={deleteChallenge} />
    </div>
  );
}
