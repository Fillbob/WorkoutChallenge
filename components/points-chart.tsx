interface DistributionPoint {
  points: number;
  count: number;
}

export function PointsChart({ distribution }: { distribution: DistributionPoint[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Points distribution</h2>
      <div className="mt-4 space-y-3">
        {distribution.map((item) => (
          <div key={item.points}>
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>{item.points} pts</span>
              <span className="font-semibold">{item.count} participants</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.min(item.count * 10, 100)}%` }}
              />
            </div>
          </div>
        ))}
        {distribution.length === 0 && <p className="text-sm text-slate-500">No points yet.</p>}
      </div>
    </div>
  );
}
