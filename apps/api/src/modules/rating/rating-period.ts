/**
 * Периоды клубного рейтинга в часовом поясе Санкт-Петербурга.
 * Москва без DST с 2014 → постоянно UTC+3.
 */
export const CLUB_TZ_OFFSET_HOURS = 3;
export const WEEKLY_FINAL_TOP = 7;

export interface ClubPeriodBounds {
  /** Понедельник 00:00 клуба (UTC Date). */
  start: Date;
  /** Следующий понедельник 00:00 клуба (UTC Date, exclusive). */
  end: Date;
  /** ISO-неделя: 2026-W32 */
  weekKey: string;
  /** Месяц понедельника недели: 2026-08 */
  monthKey: string;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Календарная дата в клубе (YYYY-MM-DD). */
export function clubDateString(date = new Date()): string {
  const shifted = new Date(date.getTime() + CLUB_TZ_OFFSET_HOURS * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

/** Instant для локальной клубной даты/времени. */
export function clubLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - CLUB_TZ_OFFSET_HOURS, minute, second));
}

/** ISO week key по алгоритму ISO-8601 для клубной календарной даты. */
export function weekKeyFromClubYmd(year: number, month: number, day: number): string {
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dayNumber = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(utc.getUTCFullYear(), 0, 4));
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);
  const week = 1 + Math.round((utc.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${utc.getUTCFullYear()}-W${pad2(week)}`;
}

export function monthKeyFromClubYmd(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}

/** Текущая (или указанная) ISO-неделя клуба: пн–вс. */
export function getClubWeekBounds(date = new Date()): ClubPeriodBounds {
  const [year, month, day] = clubDateString(date).split('-').map(Number);
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12));
  const dayNumber = (utcNoon.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  const monday = new Date(Date.UTC(year, month - 1, day - dayNumber));
  const my = monday.getUTCFullYear();
  const mm = monday.getUTCMonth() + 1;
  const md = monday.getUTCDate();

  const start = clubLocalToUtc(my, mm, md, 0, 0, 0);
  const next = new Date(Date.UTC(my, mm - 1, md + 7));
  const end = clubLocalToUtc(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
    0,
    0,
    0,
  );

  return {
    start,
    end,
    weekKey: weekKeyFromClubYmd(my, mm, md),
    monthKey: monthKeyFromClubYmd(my, mm),
  };
}

/** Предыдущая завершённая неделя относительно date. */
export function getPreviousClubWeekBounds(date = new Date()): ClubPeriodBounds {
  const current = getClubWeekBounds(date);
  return getClubWeekBounds(new Date(current.start.getTime() - 12 * 60 * 60 * 1000));
}

/** Границы календарного месяца клуба. */
export function getClubMonthBounds(date = new Date()): {
  start: Date;
  end: Date;
  monthKey: string;
} {
  const [year, month] = clubDateString(date).split('-').map(Number);
  const start = clubLocalToUtc(year, month, 1, 0, 0, 0);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = clubLocalToUtc(nextYear, nextMonth, 1, 0, 0, 0);
  return { start, end, monthKey: monthKeyFromClubYmd(year, month) };
}

export function weekKey(date = new Date()): string {
  return getClubWeekBounds(date).weekKey;
}

export function monthKey(date = new Date()): string {
  return getClubMonthBounds(date).monthKey;
}
