import { XpSettingKey } from '@prisma/client';

/**
 * XP за места в ежедневном турнире (модель 600k → 100 ур.).
 * Темп: активный игрок за год не достигает 100 уровня.
 * 21–25 и 26–30 — плоские диапазоны; 31+ — отдельные band-ключи.
 */
export const DEFAULT_PLACE_RATING: Record<number, number> = {
  1: 2000,
  2: 1600,
  3: 1300,
  4: 1100,
  5: 1000,
  6: 900,
  7: 800,
  8: 750,
  9: 700,
  10: 650,
  11: 600,
  12: 550,
  13: 500,
  14: 475,
  15: 450,
  16: 425,
  17: 400,
  18: 375,
  19: 350,
  20: 325,
  21: 250,
  22: 250,
  23: 250,
  24: 250,
  25: 250,
  26: 200,
  27: 200,
  28: 200,
  29: 200,
  30: 200,
};

/** Диапазоны мест ниже топ-30. */
export const DEFAULT_PLACE_BANDS = {
  PLACE_31_40: 125,
  PLACE_41_50: 100,
  PLACE_51_PLUS: 75,
} as const;

/** Последнее индивидуально настраиваемое место в админке. */
export const MAX_SCORING_PLACE = 30;

/** Награда XP за место в недельном рейтинге. */
export const DEFAULT_WEEKLY_REWARDS: Record<number, number> = {
  1: 2000,
  2: 1250,
  3: 800,
};

/** Награда XP за место в финале месяца. */
export const DEFAULT_MONTHLY_REWARDS: Record<number, number> = {
  1: 5000,
  2: 3000,
  3: 2000,
};

/**
 * Значения XP по умолчанию. Используются для первичного заполнения таблицы
 * настроек и как fallback, если ключ по какой-то причине отсутствует в БД.
 */
export const DEFAULT_XP_SETTINGS: Record<XpSettingKey, number> = {
  ATTENDANCE: 100,
  ELIMINATION: 50,
  RE_ENTRY: 0,
  BOUNTY: 50,
  FOUR_OF_A_KIND: 100,
  STRAIGHT_FLUSH: 200,
  ROYAL_FLUSH: 500,
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
  PLACE_31_40: DEFAULT_PLACE_BANDS.PLACE_31_40,
  PLACE_41_50: DEFAULT_PLACE_BANDS.PLACE_41_50,
  PLACE_51_PLUS: DEFAULT_PLACE_BANDS.PLACE_51_PLUS,
  WEEKLY_TOP_1: DEFAULT_WEEKLY_REWARDS[1],
  WEEKLY_TOP_2: DEFAULT_WEEKLY_REWARDS[2],
  WEEKLY_TOP_3: DEFAULT_WEEKLY_REWARDS[3],
  MONTHLY_TOP_1: DEFAULT_MONTHLY_REWARDS[1],
  MONTHLY_TOP_2: DEFAULT_MONTHLY_REWARDS[2],
  MONTHLY_TOP_3: DEFAULT_MONTHLY_REWARDS[3],
};

export const MAX_LEVEL = 100;

/** Целевой потолок XP на 100 уровне (активный игрок не достигает за год). */
export const LEVEL_100_XP = 600_000;

/**
 * Плавная кривая до 600 000 XP на 100 уровне (×2.4 от модели 250k):
 * XP(L) ≈ 2328×(L−1) + 37.68×(L−1)²
 */
export function requiredXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level >= 100) return LEVEL_100_XP;
  const n = level - 1;
  return Math.round(2328 * n + 37.68 * n * n);
}

/** Полная таблица уровней 1–100 с накопительным XP. */
export function buildLevelThresholds(maxLevel = MAX_LEVEL): {
  level: number;
  requiredXp: number;
}[] {
  const thresholds: { level: number; requiredXp: number }[] = [];
  for (let level = 1; level <= maxLevel; level += 1) {
    thresholds.push({ level, requiredXp: requiredXpForLevel(level) });
  }
  return thresholds;
}

/** Таблица уровней по умолчанию: 1–100. */
export const DEFAULT_LEVEL_THRESHOLDS = buildLevelThresholds();

/**
 * Кривая v2 (250k@100) — для пересчёта XP при миграции на 600k.
 */
export function requiredXpForLevelV2(level: number): number {
  if (level <= 1) return 0;
  if (level >= 100) return 250_000;
  const n = level - 1;
  return Math.round(970 * n + 15.7 * n * n);
}

export function buildLevelThresholdsV2(maxLevel = MAX_LEVEL): {
  level: number;
  requiredXp: number;
}[] {
  const thresholds: { level: number; requiredXp: number }[] = [];
  for (let level = 1; level <= maxLevel; level += 1) {
    thresholds.push({ level, requiredXp: requiredXpForLevelV2(level) });
  }
  return thresholds;
}

/**
 * Старая кривая (до v2) — нужна только для пересчёта XP игроков,
 * чтобы сохранить относительный прогресс уровня.
 */
export function buildLegacyLevelThresholds(maxLevel = MAX_LEVEL): {
  level: number;
  requiredXp: number;
}[] {
  const thresholds: { level: number; requiredXp: number }[] = [{ level: 1, requiredXp: 0 }];
  let step = 250;
  let cumulative = 0;

  for (let transition = 1; transition < maxLevel; transition += 1) {
    if (transition > 1) {
      if (transition - 1 < 10) step += 60;
      else if (transition - 1 < 25) step += 80;
      else if (transition - 1 < 50) step += 100;
      else if (transition - 1 < 75) step += 120;
      else step += 140;
    }
    cumulative += step;
    thresholds.push({ level: transition + 1, requiredXp: cumulative });
  }

  return thresholds;
}

/** Ключ настройки XP для конкретного места в турнире. */
export function xpSettingKeyForPlace(place: number): XpSettingKey | null {
  if (place === 1) return XpSettingKey.TOURNAMENT_WIN;
  if (place >= 2 && place <= MAX_SCORING_PLACE) {
    return `PLACE_${place}` as XpSettingKey;
  }
  if (place >= 31 && place <= 40) return XpSettingKey.PLACE_31_40;
  if (place >= 41 && place <= 50) return XpSettingKey.PLACE_41_50;
  if (place >= 51) return XpSettingKey.PLACE_51_PLUS;
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
      diff: previous == null ? null : points - previous,
    });
  }

  return {
    rows,
    totalPoints: rows.reduce((sum, row) => sum + row.points, 0),
  };
}
