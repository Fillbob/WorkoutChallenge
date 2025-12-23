export type SubmissionStatus =
  | 'pending_ai'
  | 'auto_approved'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'resubmitted';

export interface Challenge {
  base_points: number;
  bonus_points?: number;
  stretch_points?: number;
}

export interface ValidationResult {
  verdict: 'pass' | 'fail' | 'needs_review';
  confidence: number;
}

export function determineNextStatus(validation: ValidationResult): SubmissionStatus {
  if (validation.verdict === 'pass' && validation.confidence >= 0.8) {
    return 'auto_approved';
  }
  if (validation.verdict === 'fail' && validation.confidence >= 0.8) {
    return 'rejected';
  }
  return 'needs_review';
}

export function calculatePoints(challenge: Challenge, validation: ValidationResult): number {
  if (validation.verdict !== 'pass') return 0;
  let total = challenge.base_points;
  if (challenge.bonus_points) total += challenge.bonus_points;
  if (challenge.stretch_points) total += challenge.stretch_points;
  return total;
}
