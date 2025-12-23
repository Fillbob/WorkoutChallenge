import { getServiceRoleClient } from '@/lib/supabase/admin';

export interface PublicOverview {
  totalParticipants: number;
  weeklyCompletions: { week: number; completions: number }[];
  leaderboard: { user_id: string; display_name: string; points: number; team_name?: string | null }[];
  pointsDistribution: { points: number; count: number }[];
  currentChallenge?: {
    title: string;
    description: string;
    start_at: string;
    start_date: string;
    end_date: string;
    week_index: number;
    base_points: number;
    bonus_rules?: string | null;
    stretch_rules?: string | null;
  } | null;
}

export async function getPublicOverview(): Promise<PublicOverview> {
  const supabase = getServiceRoleClient();

  const { count: participantCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  const { data: leaderboard, error: leaderboardError } = await supabase.rpc('public_leaderboard');

  const { data: weekly } = await supabase
    .from('submissions')
    .select('challenge_id, challenges(week_index)')
    .eq('status', 'approved');

  const { data: currentChallenge } = await supabase
    .from('challenges')
    .select('*')
    .lte('start_at', new Date().toISOString())
    .gte('end_date', new Date().toISOString())
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
    currentChallenge: currentChallenge ?? null
  };
}
