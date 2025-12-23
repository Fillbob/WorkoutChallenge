'use client';

import { useEffect, useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

type FormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  details?: string;
};

const initialState: FormState = { status: 'idle' };

export type ChallengeFormValues = {
  id?: string;
  week_index?: number;
  title?: string;
  description?: string;
  start_at?: string;
  end_date?: string;
  base_points?: number;
  bonus_rules?: string | null;
  stretch_rules?: string | null;
};

function toLocalDateTimeInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

export function ChallengeForm({
  action,
  initialValues,
  onCancel
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initialValues?: ChallengeFormValues;
  onCancel?: () => void;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const isEditing = Boolean(initialValues?.id);
  const startAtValue = useMemo(() => toLocalDateTimeInput(initialValues?.start_at), [initialValues?.start_at]);

  useEffect(() => {
    if (state.status === 'success' && onCancel) {
      onCancel();
    }
  }, [state.status, onCancel]);

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{isEditing ? 'Update challenge' : 'Create challenge'}</h2>
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
      {isEditing && initialValues?.id && <input type="hidden" name="id" value={initialValues.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-800">
          Week index
          <input
            name="week_index"
            type="number"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            required
            defaultValue={initialValues?.week_index ?? ''}
          />
        </label>
        <label className="text-sm font-medium text-slate-800">
          Base points
          <input
            name="base_points"
            type="number"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            required
            defaultValue={initialValues?.base_points ?? ''}
          />
        </label>
      </div>
      <label className="text-sm font-medium text-slate-800">
        Title
        <input
          name="title"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          required
          defaultValue={initialValues?.title ?? ''}
        />
      </label>
      <label className="text-sm font-medium text-slate-800">
        Description
        <textarea
          name="description"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          rows={3}
          required
          defaultValue={initialValues?.description ?? ''}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-800">
          Start date &amp; time
          <input
            name="start_at"
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            required
            defaultValue={startAtValue}
          />
        </label>
        <label className="text-sm font-medium text-slate-800">
          End date
          <input
            name="end_date"
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            required
            defaultValue={initialValues?.end_date ?? ''}
          />
        </label>
      </div>
      <label className="text-sm font-medium text-slate-800">
        Bonus rules
        <input
          name="bonus_rules"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          defaultValue={initialValues?.bonus_rules ?? ''}
        />
      </label>
      <label className="text-sm font-medium text-slate-800">
        Stretch goals
        <input
          name="stretch_rules"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          defaultValue={initialValues?.stretch_rules ?? ''}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton isEditing={isEditing} />
        {isEditing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
          >
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="mt-2 w-fit rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-70"
      disabled={pending}
    >
      {pending ? 'Saving...' : isEditing ? 'Update challenge' : 'Save challenge'}
    </button>
  );
}
