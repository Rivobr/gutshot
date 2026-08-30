import {
  clubDateString,
  clubLocalToUtc,
  getNaturalClubWeekBounds,
} from '../../rating/rating-period';

export const SCHEDULE_TEMPLATE_MAX_PLAYERS = 27;
export const SCHEDULE_TEMPLATE_BUY_IN = 0;
export const SCHEDULE_TEMPLATE_STACK = 25_000;

export type ScheduleTemplateSlotDef = {
  weekday: 'wednesday' | 'friday' | 'saturday';
  /** Смещение от понедельника недели, дней. */
  dayOffset: number;
  /** Час старта Europe/Moscow. */
  hourMsk: number;
  title: string;
  description: string;
};

export const CLUB_WEEK_SCHEDULE_TEMPLATE: ScheduleTemplateSlotDef[] = [
  {
    weekday: 'wednesday',
    dayOffset: 2,
    hourMsk: 19,
    title: 'Wednesday Freeroll',
    description: `Хочешь сыграть в покер без взноса? Сегодня ждём тебя за столами 🔥

🕖 Начало — 19:00
🎟 Вход — бесплатно
🪙 Стартовый стек — 25 000

Собирайся с друзьями, занимай место за столом и покажи свою лучшую игру ♠️

📍 ул. Миллионная, 19
♠️ GUTSHOT Poker Club`,
  },
  {
    weekday: 'friday',
    dayOffset: 4,
    hourMsk: 19,
    title: 'Friday Freeroll',
    description: `♠️ ФРИРОЛЛ В GUTSHOT — НАЧАЛО В 19:00!

Хочешь сыграть в покер без взноса? Сегодня ждём тебя за столами 🔥

🕖 Начало — 19:00
🎟 Вход — бесплатно
🪙 Стартовый стек — 25 000

Собирайся с друзьями, занимай место за столом и покажи свою лучшую игру ♠️

📍 ул. Миллионная, 19
♠️ GUTSHOT Poker Club`,
  },
  {
    weekday: 'saturday',
    dayOffset: 5,
    hourMsk: 18,
    title: 'Saturday Freeroll',
    description: `♠️ ФРИРОЛЛ В GUTSHOT — НАЧАЛО В 18:00!

Хочешь сыграть в покер без взноса? Сегодня ждём тебя за столами 🔥

🕖 Начало — 18:00
🎟 Вход — бесплатно
🪙 Стартовый стек — 25 000

Собирайся с друзьями, занимай место за столом и покажи свою лучшую игру ♠️

📍 ул. Миллионная, 19
♠️ GUTSHOT Poker Club`,
  },
];

export type PlannedScheduleSlot = {
  weekday: ScheduleTemplateSlotDef['weekday'];
  title: string;
  description: string;
  date: Date;
};

/** Понедельник недели + N календарных дней (MSK). */
export function clubMondayPlusDays(
  weekStart: Date,
  dayOffset: number,
): { year: number; month: number; day: number } {
  const [year, month, day] = clubDateString(weekStart).split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function slotDateUtc(weekStart: Date, slot: ScheduleTemplateSlotDef): Date {
  const ymd = clubMondayPlusDays(weekStart, slot.dayOffset);
  return clubLocalToUtc(ymd.year, ymd.month, ymd.day, slot.hourMsk, 0, 0);
}

export function planScheduleTemplateWeek(weekStart: Date): PlannedScheduleSlot[] {
  return CLUB_WEEK_SCHEDULE_TEMPLATE.map((slot) => ({
    weekday: slot.weekday,
    title: slot.title,
    description: slot.description,
    date: slotDateUtc(weekStart, slot),
  }));
}

/**
 * Ближайшая неделя, куда ещё можно поставить шаблон:
 * текущая, если суббота ещё не прошла; иначе следующая, и так далее.
 */
export function resolveScheduleTemplateWeekStart(now = new Date()): Date {
  const current = getNaturalClubWeekBounds(now);
  const saturdayStart = slotDateUtc(
    current.start,
    CLUB_WEEK_SCHEDULE_TEMPLATE[CLUB_WEEK_SCHEDULE_TEMPLATE.length - 1],
  );
  if (now.getTime() < saturdayStart.getTime()) {
    return current.start;
  }
  return getNaturalClubWeekBounds(new Date(current.end.getTime() + 60 * 60 * 1000)).start;
}
