import { getServiceRoleClient } from '@/lib/supabase/admin';

type PublicChallenge = {
  title: string;
  description: string;
  start_at: string;
  start_date: string;
  end_date: string;
  week_index: number;
  base_points: number;
  bonus_rules?: string | null;
  stretch_rules?: string | null;
};

export interface PublicOverview {
  totalParticipants: number;
  weeklyCompletions: { week: number; completions: number }[];
  leaderboard: { user_id: string; display_name: string; points: number; team_name?: string | null }[];
  pointsDistribution: { points: number; count: number }[];
  currentChallenge?: PublicChallenge | null;
  upcomingChallenge?: PublicChallenge | null;
}

export async function getPublicOverview(): Promise<PublicOverview> {
  const supabase = getServiceRoleClient();
  const nowIso = new Date().toISOString();
  const today = nowIso.split('T')[0];

  const { count: participantCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  const { data: leaderboard, error: leaderboardError } = await supabase.rpc('public_leaderboard');

  const { data: weekly } = await supabase
    .from('submissions')
    .select('challenge_id, challenges(week_index)')
    .in('status', ['approved', 'auto_approved']);

  const { data: currentChallenge } = await supabase
    .from('challenges')
    .select('*')
    .lte('start_at', nowIso)
    .gte('end_date', today)
    .order('start_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: upcomingChallenge } = await supabase
    .from('challenges')
    .select('*')
    .gt('start_at', nowIso)
    .order('start_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const weeklyCompletions = (weekly ?? []).reduce<Record<number, number>>((acc, row: any) => {
    const week = Number(row.challenges?.week_index ?? row.challenge_id);
    acc[week] = (acc[week] || 0) + 1;
    return acc;
  }, {});

  const leaderboardRows = (leaderboardError ? [] : leaderboard ?? []) as PublicOverview['leaderboard'];

  const pointsDistribution = leaderboardRows.reduce<Record<number, number>>((acc, row) => {
    acc[row.points] = (acc[row.points] || 0) + 1;
    return acc;
  }, {});

  return {
    totalParticipants: participantCount ?? 0,
    weeklyCompletions: Object.entries(weeklyCompletions).map(([week, completions]) => ({
      week: Number(week),
      completions
    })),
    leaderboard: leaderboardRows,
    pointsDistribution: Object.entries(pointsDistribution).map(([points, count]) => ({
      points: Number(points),
      count
    })),
    currentChallenge: currentChallenge ?? null,
    upcomingChallenge: upcomingChallenge ?? null
  };
}
