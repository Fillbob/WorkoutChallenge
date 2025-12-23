'use client';

import { useFormState, useFormStatus } from 'react-dom';

type FormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  details?: string;
};

const initialState: FormState = { status: 'idle' };

export function ChallengeForm({ action }: { action: (state: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Create / update challenge</h2>
      {state.status === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Could not save challenge</p>
          <p>{state.message}</p>
          {state.details && <p className="mt-1 text-xs text-red-700">Details: {state.details}</p>}
        </div>
      )}
      {state.status === 'success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-semibold">Challenge saved</p>
          {state.message && <p>{state.message}</p>}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-800">
          Week index
          <input name="week_index" type="number" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
        </label>
        <label className="text-sm font-medium text-slate-800">
          Base points
          <input name="base_points" type="number" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
        </label>
      </div>
      <label className="text-sm font-medium text-slate-800">
        Title
        <input name="title" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
      </label>
      <label className="text-sm font-medium text-slate-800">
        Description
        <textarea name="description" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" rows={3} required />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-800">
          Start date &amp; time
          <input
            name="start_at"
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-800">
          End date
          <input name="end_date" type="date" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" required />
        </label>
      </div>
      <label className="text-sm font-medium text-slate-800">
        Bonus rules
        <input name="bonus_rules" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
      </label>
      <label className="text-sm font-medium text-slate-800">
        Stretch goals
        <input name="stretch_rules" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
      </label>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="mt-2 w-fit rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-70"
      disabled={pending}
    >
      {pending ? 'Saving...' : 'Save challenge'}
    </button>
  );
}
