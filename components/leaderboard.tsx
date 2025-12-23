interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  points: number;
  team_name?: string | null;
}

export function Leaderboard({ data }: { data: LeaderboardEntry[] }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        <p className="text-xs text-slate-500">Top 10 public names only</p>
      </div>
      <ul className="mt-4 space-y-2">
        {data.map((entry, idx) => (
          <li
            key={entry.user_id}
            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="h-7 w-7 rounded-full bg-white text-center text-xs font-semibold text-slate-700 shadow">
                #{idx + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{entry.display_name}</p>
                {entry.team_name && <p className="text-xs text-slate-500">Team {entry.team_name}</p>}
              </div>
            </div>
            <span className="text-sm font-semibold text-primary">{entry.points} pts</span>
          </li>
        ))}
        {data.length === 0 && <li className="text-sm text-slate-500">No leaderboard data yet.</li>}
      </ul>
    </div>
  );
}
