import { getPublicOverview } from '@/lib/data/public';

export default async function ExportPage() {
  const overview = await getPublicOverview();
  const winner = overview.leaderboard[0];
  const teamTotals: Record<string, { points: number; name: string }> = {};
  overview.leaderboard.forEach((entry) => {
    if (!entry.team_name) return;
    if (!teamTotals[entry.team_name]) teamTotals[entry.team_name] = { name: entry.team_name, points: 0 };
    teamTotals[entry.team_name].points += entry.points;
  });
  const teamWinner = Object.values(teamTotals).sort((a, b) => b.points - a.points)[0];

  const engraving = `Winner: ${winner?.display_name ?? 'TBD'}\nTeam: ${teamWinner?.name ?? 'TBD'}\nPoints: ${
    winner?.points ?? 0
  }`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Trophy export</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Winner</p>
        <p className="text-lg font-semibold text-slate-900">{winner?.display_name ?? 'TBD'}</p>
        <p className="text-sm text-slate-700">{winner ? `${winner.points} pts` : 'Awaiting results'}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Team winner</p>
        <p className="text-lg font-semibold text-slate-900">{teamWinner?.name ?? 'TBD'}</p>
        <p className="text-sm text-slate-700">{teamWinner ? `${teamWinner.points} pts` : 'Awaiting results'}</p>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-800">
        <p className="font-semibold">Engraving text</p>
        <pre className="mt-2 whitespace-pre-wrap font-mono">{engraving}</pre>
      </div>
    </div>
  );
}
