'use client';

import { useCallback, useState } from 'react';
import { ChallengeForm, ChallengeFormValues } from './challenge-form';

type Challenge = ChallengeFormValues & {
  id: string;
  start_date: string;
  completion_path?: string | null;
  created_at?: string | null;
};

export function ChallengesManager({
  challenges,
  upsertAction,
  deleteAction
}: {
  challenges: Challenge[];
  upsertAction: (state: any, formData: FormData) => Promise<any>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = useState<Challenge | null>(null);

  const handleEdit = useCallback((challenge: Challenge) => {
    setEditing(challenge);
  }, []);

  const handleCancel = useCallback(() => setEditing(null), []);

  return (
    <div className="space-y-8">
      <ChallengeForm key={editing?.id ?? 'new'} action={upsertAction} initialValues={editing ?? undefined} onCancel={handleCancel} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Existing challenges</h2>
        <div className="mt-4 grid gap-3 text-sm">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase text-slate-500">Week {challenge.week_index}</p>
                  <p className="text-lg font-semibold text-slate-900">{challenge.title}</p>
                  <p className="text-slate-700">{challenge.description}</p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>Start: {new Date(challenge.start_at ?? challenge.start_date).toLocaleString()}</p>
                  <p>End: {challenge.end_date}</p>
                  <p className="font-semibold text-primary">{challenge.base_points} pts</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(challenge)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm"
                >
                  Edit
                </button>
                <form
                  action={deleteAction}
                  onSubmit={(event) => {
                    const confirmed = window.confirm(`Delete "${challenge.title}"? This cannot be undone.`);
                    if (!confirmed) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={challenge.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 shadow-sm"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
          {(!challenges || challenges.length === 0) && <p className="text-slate-600">No challenges yet.</p>}
        </div>
      </div>
    </div>
  );
}
