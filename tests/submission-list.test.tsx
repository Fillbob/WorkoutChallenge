import React from 'react';
import { renderToString } from 'react-dom/server';

import { SubmissionList } from '@/components/submission-list';

describe('SubmissionList', () => {
  it('shows zero points awarded', () => {
    const html = renderToString(
      <SubmissionList
        submissions={[
          {
            id: '1',
            challenge_id: 'challenge-1',
            status: 'approved',
            created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
            points_awarded: 0
          }
        ]}
        challengeLookup={{ 'challenge-1': { title: 'Test Challenge' } }}
      />
    );

    const normalizedHtml = html.replace(/<!--.*?-->/g, '');

    expect(normalizedHtml).toContain('+0 pts');
  });
});
