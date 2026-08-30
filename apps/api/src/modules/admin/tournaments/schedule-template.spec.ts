import { clubLocalToUtc } from '../../rating/rating-period';
import {
  planScheduleTemplateWeek,
  resolveScheduleTemplateWeekStart,
  slotDateUtc,
  CLUB_WEEK_SCHEDULE_TEMPLATE,
} from './schedule-template';

describe('club week schedule template', () => {
  const weekStart = clubLocalToUtc(2026, 8, 31, 0, 0, 0);

  it('puts Wed 19:00, Fri 19:00 and Sat 18:00 Moscow', () => {
    const planned = planScheduleTemplateWeek(weekStart);
    expect(planned.map((row) => row.title)).toEqual([
      'Wednesday Freeroll',
      'Friday Freeroll',
      'Saturday Freeroll',
    ]);
    expect(planned[0].date.toISOString()).toBe('2026-09-02T16:00:00.000Z');
    expect(planned[1].date.toISOString()).toBe('2026-09-04T16:00:00.000Z');
    expect(planned[2].date.toISOString()).toBe('2026-09-05T15:00:00.000Z');
  });

  it('after Saturday start jumps to the next Monday', () => {
    const saturdayEvening = slotDateUtc(weekStart, CLUB_WEEK_SCHEDULE_TEMPLATE[2]);
    const after = resolveScheduleTemplateWeekStart(new Date(saturdayEvening.getTime() + 60 * 1000));
    expect(after.toISOString()).toBe(clubLocalToUtc(2026, 9, 7, 0, 0, 0).toISOString());
  });

  it('before Saturday stays on the current week', () => {
    const friday = clubLocalToUtc(2026, 9, 4, 12, 0, 0);
    const start = resolveScheduleTemplateWeekStart(friday);
    expect(start.toISOString()).toBe(weekStart.toISOString());
  });
});
