import { getServiceRoleClient } from '@/lib/supabase/admin';
import { getServerClient } from '@/lib/supabase/server';

export interface ChallengeInput {
  week_index: number;
  title: string;
  description: string;
  start_at: string;
  start_date: string;
  end_date: string;
  base_points: number;
  bonus_rules?: string;
  stretch_rules?: string;
}

export async function listChallenges() {
  const supabase = getServerClient();
  const { data } = await supabase.from('challenges').select('*').order('week_index', { ascending: true });
  return data ?? [];
}

export async function upsertChallenge(input: ChallengeInput, userId: string) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from('challenges').upsert({ ...input, created_by: userId }).select();
  if (error) throw error;
  return data;
}
