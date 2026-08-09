import {
  WEEKLY_FINAL_TOP,
  getClubMonthBounds,
  getClubWeekBounds,
  getPreviousClubWeekBounds,
  weekKey,
} from './rating-period';

describe('rating-period', () => {
  it('uses top-7 cutoff', () => {
    expect(WEEKLY_FINAL_TOP).toBe(7);
  });

  it('builds a Mon–Sun club week around a mid-week date', () => {
    // Wednesday 2026-08-12 12:00 UTC = 15:00 Moscow
    const week = getClubWeekBounds(new Date('2026-08-12T12:00:00.000Z'));
    expect(week.weekKey).toBe('2026-W33');
    expect(week.monthKey).toBe('2026-08');
    // Monday 00:00 Moscow = Sunday 21:00 UTC
    expect(week.start.toISOString()).toBe('2026-08-09T21:00:00.000Z');
    expect(week.end.toISOString()).toBe('2026-08-16T21:00:00.000Z');
  });

  it('previous week is the week before current', () => {
    const current = getClubWeekBounds(new Date('2026-08-12T12:00:00.000Z'));
    const previous = getPreviousClubWeekBounds(new Date('2026-08-12T12:00:00.000Z'));
    expect(previous.end.getTime()).toBe(current.start.getTime());
    expect(previous.weekKey).toBe('2026-W32');
  });

  it('month bounds start on the 1st in Moscow', () => {
    const month = getClubMonthBounds(new Date('2026-08-09T10:00:00.000Z'));
    expect(month.monthKey).toBe('2026-08');
    expect(month.start.toISOString()).toBe('2026-07-31T21:00:00.000Z');
  });

  it('weekKey helper matches bounds', () => {
    const date = new Date('2026-08-12T12:00:00.000Z');
    expect(weekKey(date)).toBe(getClubWeekBounds(date).weekKey);
  });
});
