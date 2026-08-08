import { XpSettingKey } from '@prisma/client';

/**
 * XP за места в ежедневном турнире (ТЗ клуба, места 1–30).
 * Ниже 30 места XP за место не начисляется, но турнир засчитывается
 * в достижения за количество сыгранных турниров.
 */
export const DEFAULT_PLACE_RATING: Record<number, number> = {
  1: 5000,
  2: 3800,
  3: 3000,
  4: 2500,
  5: 2100,
  6: 1800,
  7: 1600,
  8: 1450,
  9: 1300,
  10: 1200,
  11: 1100,
  12: 1000,
  13: 900,
  14: 825,
  15: 750,
  16: 700,
  17: 650,
  18: 600,
  19: 550,
  20: 500,
  21: 450,
  22: 400,
  23: 350,
  24: 300,
  25: 250,
  26: 225,
  27: 200,
  28: 175,
  29: 150,
  30: 125,
};

/** Последнее место, за которое начисляется XP. */
export const MAX_SCORING_PLACE = 30;

/** Награда XP за место в недельном рейтинге. */
export const DEFAULT_WEEKLY_REWARDS: Record<number, number> = {
  1: 15000,
  2: 10000,
  3: 7000,
};

/** Награда XP за место в финале месяца. */
export const DEFAULT_MONTHLY_REWARDS: Record<number, number> = {
  1: 30000,
  2: 20000,
  3: 12000,
};

/**
 * Значения XP по умолчанию. Используются для первичного заполнения таблицы
 * настроек и как fallback, если ключ по какой-то причине отсутствует в БД.
 */
export const DEFAULT_XP_SETTINGS: Record<XpSettingKey, number> = {
  ATTENDANCE: 100,
  ELIMINATION: 50,
  RE_ENTRY: 0,
  BOUNTY: 75,
  FOUR_OF_A_KIND: 150,
  STRAIGHT_FLUSH: 300,
  ROYAL_FLUSH: 1000,
  TOURNAMENT_WIN: DEFAULT_PLACE_RATING[1],
  PLACE_2: DEFAULT_PLACE_RATING[2],
  PLACE_3: DEFAULT_PLACE_RATING[3],
  PLACE_4: DEFAULT_PLACE_RATING[4],
  PLACE_5: DEFAULT_PLACE_RATING[5],
  PLACE_6: DEFAULT_PLACE_RATING[6],
  PLACE_7: DEFAULT_PLACE_RATING[7],
  PLACE_8: DEFAULT_PLACE_RATING[8],
  PLACE_9: DEFAULT_PLACE_RATING[9],
  PLACE_10: DEFAULT_PLACE_RATING[10],
  PLACE_11: DEFAULT_PLACE_RATING[11],
  PLACE_12: DEFAULT_PLACE_RATING[12],
  PLACE_13: DEFAULT_PLACE_RATING[13],
  PLACE_14: DEFAULT_PLACE_RATING[14],
  PLACE_15: DEFAULT_PLACE_RATING[15],
  PLACE_16: DEFAULT_PLACE_RATING[16],
  PLACE_17: DEFAULT_PLACE_RATING[17],
  PLACE_18: DEFAULT_PLACE_RATING[18],
  PLACE_19: DEFAULT_PLACE_RATING[19],
  PLACE_20: DEFAULT_PLACE_RATING[20],
  PLACE_21: DEFAULT_PLACE_RATING[21],
  PLACE_22: DEFAULT_PLACE_RATING[22],
  PLACE_23: DEFAULT_PLACE_RATING[23],
  PLACE_24: DEFAULT_PLACE_RATING[24],
  PLACE_25: DEFAULT_PLACE_RATING[25],
  PLACE_26: DEFAULT_PLACE_RATING[26],
  PLACE_27: DEFAULT_PLACE_RATING[27],
  PLACE_28: DEFAULT_PLACE_RATING[28],
  PLACE_29: DEFAULT_PLACE_RATING[29],
  PLACE_30: DEFAULT_PLACE_RATING[30],
  WEEKLY_TOP_1: DEFAULT_WEEKLY_REWARDS[1],
  WEEKLY_TOP_2: DEFAULT_WEEKLY_REWARDS[2],
  WEEKLY_TOP_3: DEFAULT_WEEKLY_REWARDS[3],
  MONTHLY_TOP_1: DEFAULT_MONTHLY_REWARDS[1],
  MONTHLY_TOP_2: DEFAULT_MONTHLY_REWARDS[2],
  MONTHLY_TOP_3: DEFAULT_MONTHLY_REWARDS[3],
};

export const MAX_LEVEL = 100;

/**
 * Стоимость перехода на следующий уровень растёт ступенями (ТЗ клуба):
 * первый переход 250 XP, далее шаг дорожает на 60/80/100/120/140 XP
 * в зависимости от диапазона уровней.
 *
 * Контрольные значения: 10 ур. — 4 410, 50 ур. — 104 410, 100 ур. — 481 910 XP.
 */
function levelStepIncrement(transition: number): number {
  if (transition < 10) return 60;
  if (transition < 25) return 80;
  if (transition < 50) return 100;
  if (transition < 75) return 120;
  return 140;
}

/** Полная таблица уровней 1–100 с накопительным XP. */
export function buildLevelThresholds(maxLevel = MAX_LEVEL): {
  level: number;
  requiredXp: number;
}[] {
  const thresholds: { level: number; requiredXp: number }[] = [{ level: 1, requiredXp: 0 }];

  let step = 250;
  let cumulative = 0;

  for (let transition = 1; transition < maxLevel; transition += 1) {
    if (transition > 1) {
      step += levelStepIncrement(transition - 1);
    }
    cumulative += step;
    thresholds.push({ level: transition + 1, requiredXp: cumulative });
  }

  return thresholds;
}

/** Таблица уровней по умолчанию: 1–100 по ТЗ клуба. */
export const DEFAULT_LEVEL_THRESHOLDS = buildLevelThresholds();

/** Ключ настройки XP для конкретного места в турнире (1–30). */
export function xpSettingKeyForPlace(place: number): XpSettingKey | null {
  if (place === 1) return XpSettingKey.TOURNAMENT_WIN;
  if (place >= 2 && place <= MAX_SCORING_PLACE) {
    return `PLACE_${place}` as XpSettingKey;
  }
  return null;
}

export interface PlaceRatingRow {
  place: number;
  points: number;
  diff: number | null;
}

/** Собирает шкалу рейтинга 1–30 из карты настроек XP. */
export function buildPlaceRatingScale(settings: Partial<Record<XpSettingKey, number>>): {
  rows: PlaceRatingRow[];
  totalPoints: number;
} {
  const rows: PlaceRatingRow[] = [];

  for (let place = 1; place <= MAX_SCORING_PLACE; place += 1) {
    const key = xpSettingKeyForPlace(place);
    const points = (key ? settings[key] : undefined) ?? DEFAULT_PLACE_RATING[place] ?? 0;
    const previous = place === 1 ? null : (rows[place - 2]?.points ?? 0);
    rows.push({
      place,
      points,
      diff: previous === null ? null : points - previous,
    });
  }

  return {
    rows,
    totalPoints: rows.reduce((sum, row) => sum + row.points, 0),
  };
}
