import { formatDistanceToNow } from 'date-fns';

interface SubmissionListProps {
  submissions: any[];
}

const statusMap: Record<string, string> = {
  pending_ai: 'Submitted (awaiting review)',
  auto_approved: 'Auto-approved',
  needs_review: 'Needs admin review',
  approved: 'Approved',
  rejected: 'Rejected',
  resubmitted: 'Resubmitted'
};

export function SubmissionList({ submissions }: SubmissionListProps) {
  if (submissions.length === 0) {
    return <p className="text-sm text-slate-600">No submissions yet. Upload proof to get started.</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {submissions.map((submission) => (
        <li key={submission.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Challenge #{submission.challenge_id}</p>
              <p className="text-slate-600">{statusMap[submission.status] ?? submission.status}</p>
            </div>
            <div className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
            </div>
          </div>
          {submission.points_awarded && (
            <p className="mt-1 text-xs font-semibold text-emerald-700">+{submission.points_awarded} pts</p>
          )}
        </li>
      ))}
    </ul>
  );
}
