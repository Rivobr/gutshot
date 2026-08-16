import {
  WEEKLY_FINAL_TOP,
  getClubMonthBounds,
  getClubWeekBounds,
  getNaturalClubWeekBounds,
  getOpeningExtendedWeekBounds,
  getPreviousClubWeekBounds,
  isClubSaturday,
  resolveWeeklyDisplayWeeks,
  weekKey,
} from './rating-period';

describe('rating-period', () => {
  it('uses top-7 cutoff', () => {
    expect(WEEKLY_FINAL_TOP).toBe(7);
  });

  it('uses opening extended week through 16 Aug 2026', () => {
    const extended = getOpeningExtendedWeekBounds();
    expect(extended.weekKey).toBe('2026-W32E');
    expect(extended.start.toISOString()).toBe('2026-08-02T21:00:00.000Z');
    expect(extended.end.toISOString()).toBe('2026-08-16T21:00:00.000Z');

    // Monday after opening Sunday — still the extended week
    const mondayNight = getClubWeekBounds(new Date('2026-08-09T21:30:00.000Z'));
    expect(mondayNight.weekKey).toBe('2026-W32E');
    expect(mondayNight.start.toISOString()).toBe(extended.start.toISOString());
    expect(mondayNight.end.toISOString()).toBe(extended.end.toISOString());

    // Mid next week still extended
    const mid = getClubWeekBounds(new Date('2026-08-12T12:00:00.000Z'));
    expect(mid.weekKey).toBe('2026-W32E');
  });

  it('returns to natural Mon–Sun weeks after the extension ends', () => {
    const after = getClubWeekBounds(new Date('2026-08-17T12:00:00.000Z'));
    const natural = getNaturalClubWeekBounds(new Date('2026-08-17T12:00:00.000Z'));
    expect(after.weekKey).toBe(natural.weekKey);
    expect(after.weekKey).toBe('2026-W34');
    expect(after.start.toISOString()).toBe('2026-08-16T21:00:00.000Z');
    expect(after.end.toISOString()).toBe('2026-08-23T21:00:00.000Z');
  });

  it('previous week after extension is the extended opening week', () => {
    const previous = getPreviousClubWeekBounds(new Date('2026-08-17T12:00:00.000Z'));
    expect(previous.weekKey).toBe('2026-W32E');
  });

  it('moves a force-closed current week into previous and opens the next as current', () => {
    const now = new Date('2026-08-16T02:50:00.000Z');
    const open = resolveWeeklyDisplayWeeks(now, false);
    expect(open.current.weekKey).toBe('2026-W32E');

    const closed = resolveWeeklyDisplayWeeks(now, true);
    expect(closed.previous.weekKey).toBe('2026-W32E');
    expect(closed.current.weekKey).toBe('2026-W34');
    expect(closed.current.start.toISOString()).toBe('2026-08-16T21:00:00.000Z');
  });

  it('natural Mon–Sun club week around a mid-week date (without override)', () => {
    const week = getNaturalClubWeekBounds(new Date('2026-08-12T12:00:00.000Z'));
    expect(week.weekKey).toBe('2026-W33');
    expect(week.start.toISOString()).toBe('2026-08-09T21:00:00.000Z');
    expect(week.end.toISOString()).toBe('2026-08-16T21:00:00.000Z');
  });

  it('month bounds start on the 1st in Moscow', () => {
    const month = getClubMonthBounds(new Date('2026-08-09T10:00:00.000Z'));
    expect(month.monthKey).toBe('2026-08');
    expect(month.start.toISOString()).toBe('2026-07-31T21:00:00.000Z');
  });

  it('detects Saturday in club timezone', () => {
    expect(isClubSaturday(new Date('2026-08-15T15:00:00.000Z'))).toBe(true);
    expect(isClubSaturday(new Date('2026-08-14T16:00:00.000Z'))).toBe(false);
    expect(isClubSaturday(new Date('2026-08-16T02:45:00.000Z'))).toBe(false);
  });

  it('weekKey helper matches bounds', () => {
    const date = new Date('2026-08-12T12:00:00.000Z');
    expect(weekKey(date)).toBe(getClubWeekBounds(date).weekKey);
  });
});
