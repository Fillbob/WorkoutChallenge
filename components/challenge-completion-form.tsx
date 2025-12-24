'use client';

import { useEffect } from 'react';
import { addDays, format } from 'date-fns';
import { useFormState, useFormStatus } from 'react-dom';
import { CheckCircle } from './icons';

export type CompletionFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

type Props = {
  challenge: {
    id: string;
    title: string;
    start_at?: string;
    start_date?: string;
    end_date: string;
    base_points: number;
    completion_path?: string | null;
  };
  defaultCompleted: boolean;
  disabled: boolean;
  onSubmitAction: (state: CompletionFormState, formData: FormData) => Promise<CompletionFormState>;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {disabled ? 'Closed' : pending ? 'Saving...' : 'Save'}
    </button>
  );
}

export function ChallengeCompletionForm({ challenge, defaultCompleted, disabled, onSubmitAction }: Props) {
  const [state, formAction] = useFormState(onSubmitAction, { status: 'idle' });
  const completionPath = challenge.completion_path ?? '/dashboard';

  useEffect(() => {
    if (state.status === 'success' && completionPath) {
      window.location.assign(completionPath);
    }
  }, [state.status, completionPath]);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm"
    >
      <input type="hidden" name="challenge_id" value={challenge.id} />
      <label className="flex min-w-[220px] items-center gap-3">
        <input
          type="checkbox"
          name="completed"
          defaultChecked={defaultCompleted}
          disabled={disabled}
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">{challenge.title}</span>
          <span className="text-xs text-slate-600">
            {format(new Date(challenge.start_at ?? challenge.start_date ?? challenge.end_date), 'MMM d')} –{' '}
            {format(new Date(challenge.end_date), 'MMM d')}
          </span>
          <span className="text-[11px] text-slate-500">
            Mark by {format(addDays(new Date(challenge.end_date), 7), 'MMM d')}.
          </span>
        </div>
      </label>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <CheckCircle /> {challenge.base_points} pts
        </span>
        <SubmitButton disabled={disabled} />
      </div>
      {state.status !== 'idle' && (
        <p
          className={`text-xs ${
            state.status === 'error' ? 'text-red-600' : 'text-green-600'
          }`}
          role={state.status === 'error' ? 'alert' : 'status'}
        >
          {state.message ?? (state.status === 'success' ? 'Saved!' : 'Something went wrong')}
        </p>
      )}
    </form>
  );
}
