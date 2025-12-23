import { format } from 'date-fns';
import { CheckCircle } from './icons';

interface ChallengeCardProps {
  challenge?: {
    title: string;
    description: string;
    start_at?: string;
    start_date: string;
    end_date: string;
    base_points: number;
    bonus_rules?: string | null;
    stretch_rules?: string | null;
  } | null;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  if (!challenge) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600">No challenge is published yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Current week</p>
          <h3 className="text-2xl font-semibold text-slate-900">{challenge.title}</h3>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle /> {challenge.base_points} pts
        </span>
      </div>
      <p className="mt-2 text-slate-700">{challenge.description}</p>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <p className="font-semibold text-slate-800">Timing</p>
          <p>
            {format(new Date(challenge.start_at ?? challenge.start_date), 'MMM d p')} –{' '}
            {format(new Date(challenge.end_date), 'MMM d')}
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">Bonus / Stretch</p>
          <p>{challenge.bonus_rules ?? 'No bonus this week'}</p>
          <p>{challenge.stretch_rules ?? 'No stretch goal this week'}</p>
        </div>
      </div>
    </div>
  );
}
