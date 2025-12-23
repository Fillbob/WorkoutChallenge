'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';

export function UploadForm({ challengeId }: { challengeId: string | number }) {
  const { supabase, session } = useAuth();
  const [files, setFiles] = useState<FileList | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0 || !session) return;
    setLoading(true);
    setMessage(null);

    const { data: submissionRow, error } = await supabase
      .from('submissions')
      .insert({ challenge_id: challengeId, status: 'pending_ai', user_id: session.user.id })
      .select('*')
      .maybeSingle();

    if (error || !submissionRow) {
      setMessage('Could not create submission.');
      setLoading(false);
      return;
    }

    for (const file of Array.from(files).slice(0, 5)) {
      const path = `${session.user.id}/${submissionRow.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('submission-proofs')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        setMessage('Upload failed.');
        setLoading(false);
        return;
      }
      await supabase.from('submission_images').insert({ submission_id: submissionRow.id, storage_path: path });
    }

    setMessage('Submitted. We will run AI validation shortly.');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Upload proof</h3>
      <p className="text-sm text-slate-600">Upload 1–5 photos or screenshots. Only you and admins can view them.</p>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setFiles(e.target.files)}
        className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
      >
        {loading ? 'Uploading…' : 'Submit for review'}
      </button>
      {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
    </form>
  );
}
