import Link from 'next/link';
import { ArrowRight } from '@/components/icons';
import { getPublicOverview } from '@/lib/data/public';
import { ChallengeCard } from '@/components/challenge-card';
import { Leaderboard } from '@/components/leaderboard';
import { PointsChart } from '@/components/points-chart';

export const revalidate = 60;

export default async function HomePage() {
  const overview = await getPublicOverview();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="grid gap-6 rounded-2xl bg-gradient-to-r from-primary/90 to-accent/80 p-8 text-white shadow-lg lg:grid-cols-2">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold lg:text-4xl">Workout Challenge</h1>
          <p className="text-lg text-white/90">
            13 weeks. Simple weekly check-ins. Light admin oversight. Stay consistent from Jan 1 to Mar 31, 2026.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1">Public dashboard</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Simple weekly check-ins</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Admin oversight</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-primary shadow"
            >
              Go to dashboard <ArrowRight />
            </Link>
            <Link href="/how-it-works" className="text-white underline">
              How it works
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-white/10 p-4 shadow">
            <div className="text-white/70">Participants</div>
            <div className="text-3xl font-bold">{overview.totalParticipants}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4 shadow">
            <div className="text-white/70">Weekly completions</div>
            <div className="text-3xl font-bold">{overview.weeklyCompletions.length}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4 shadow">
            <div className="text-white/70">Leaderboard entries</div>
            <div className="text-3xl font-bold">{overview.leaderboard.length}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4 shadow">
            <div className="text-white/70">Weeks</div>
            <div className="text-3xl font-bold">13</div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Current week</h2>
            <Link href="/dashboard" className="text-primary">
              View dashboard
            </Link>
          </div>
          <ChallengeCard challenge={overview.currentChallenge ?? undefined} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Leaderboard data={overview.leaderboard.slice(0, 10)} />
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Weekly challenge status</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {overview.weeklyCompletions.map((week) => (
              <li key={week.week} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>Week {week.week}</span>
                <span className="font-semibold">{week.completions} completions</span>
              </li>
            ))}
            {overview.weeklyCompletions.length === 0 && (
              <li className="text-slate-500">No completions reported yet.</li>
            )}
          </ul>
        </div>
        <PointsChart distribution={overview.pointsDistribution} />
      </section>
    </div>
  );
}
