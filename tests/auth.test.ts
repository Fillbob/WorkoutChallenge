import { vi } from 'vitest';

import { requireAdmin } from '@/lib/auth';
import { getServerClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server');
vi.mock('@/lib/supabase/admin', () => ({
  getServiceRoleClient: () => {
    throw new Error('service role client should not be used');
  }
}));

type SupabaseUser = { id: string; email?: string };

type SupabaseProfile = { role?: string } | null;

function createSupabaseMock({ user, profile }: { user: SupabaseUser | null; profile: SupabaseProfile }) {
  const maybeSingle = vi.fn(async () => ({ data: profile }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  const auth = {
    getUser: vi.fn(async () => ({ data: { user } }))
  };

  return { auth, from, select, eq, maybeSingle };
}

describe('requireAdmin', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns false when no user is signed in', async () => {
    const supabase = createSupabaseMock({ user: null, profile: null });
    vi.mocked(getServerClient).mockReturnValue(supabase as any);

    const result = await requireAdmin();

    expect(result).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns true for admin role profiles', async () => {
    const supabase = createSupabaseMock({ user: { id: 'user-1' }, profile: { role: 'admin' } });
    vi.mocked(getServerClient).mockReturnValue(supabase as any);

    const result = await requireAdmin();

    expect(result).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(supabase.select).toHaveBeenCalledWith('role');
    expect(supabase.eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('returns false for non-admin roles', async () => {
    const supabase = createSupabaseMock({ user: { id: 'user-2' }, profile: { role: 'member' } });
    vi.mocked(getServerClient).mockReturnValue(supabase as any);

    const result = await requireAdmin();

    expect(result).toBe(false);
  });
});
