import { calculatePoints, determineNextStatus } from '@/lib/points';

describe('determineNextStatus', () => {
  it('auto-approves confident passes', () => {
    const status = determineNextStatus({ verdict: 'pass', confidence: 0.92 });
    expect(status).toBe('auto_approved');
  });

  it('rejects confident fails', () => {
    const status = determineNextStatus({ verdict: 'fail', confidence: 0.85 });
    expect(status).toBe('rejected');
  });

  it('sends low confidence to review', () => {
    const status = determineNextStatus({ verdict: 'pass', confidence: 0.6 });
    expect(status).toBe('needs_review');
  });
});

describe('calculatePoints', () => {
  it('awards base points on pass', () => {
    const points = calculatePoints({ base_points: 50 }, { verdict: 'pass', confidence: 0.91 });
    expect(points).toBe(50);
  });

  it('awards zero on fail', () => {
    const points = calculatePoints({ base_points: 50 }, { verdict: 'fail', confidence: 0.91 });
    expect(points).toBe(0);
  });

  it('adds bonus and stretch', () => {
    const points = calculatePoints(
      { base_points: 50, bonus_points: 10, stretch_points: 20 },
      { verdict: 'pass', confidence: 0.95 }
    );
    expect(points).toBe(80);
  });
});
