export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">How it works</h1>
      <ol className="list-decimal space-y-4 pl-5 text-slate-700">
        <li>Sign in with Google. Your email stays private; only your display name is public.</li>
        <li>Pick a nickname and join or create a team (optional).</li>
        <li>Open the current week challenge and mark completion.</li>
        <li>Admins can verify progress via the leaderboard and completions.</li>
        <li>Earn points each week. Leaderboard uses display names only.</li>
        <li>Admins can review completion totals with full audit logging.</li>
      </ol>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
        <p className="font-semibold text-slate-900">Privacy</p>
        <p>Only aggregated stats are public; leaderboard uses display names or nicknames.</p>
      </div>
    </div>
  );
}
