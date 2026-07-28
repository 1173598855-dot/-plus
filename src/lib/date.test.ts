import { describe, expect, it, vi } from 'vitest';
import { formatDate, todayIso } from './date';

describe('date', () => {
  it('uses local calendar fields instead of the UTC date', () => {
    const date = new Date('2026-01-01T16:30:00.000Z');
    vi.spyOn(date, 'getFullYear').mockReturnValue(2026);
    vi.spyOn(date, 'getMonth').mockReturnValue(0);
    vi.spyOn(date, 'getDate').mockReturnValue(2);

    expect(todayIso(date)).toBe('2026-01-02');
  });

  it('returns the empty-date label for invalid input', () => {
    expect(formatDate('not-a-date')).toBe('无日期');
  });
});
