import { XpSettingKey } from '@prisma/client';

/**
 * Шкала рейтинга за места 1–20 (сумма 30 525).
 * 1 место — премия за победу; со 2 по 20 — плавное нелинейное снижение.
 */
export const DEFAULT_PLACE_RATING: Record<number, number> = {
  1: 3600,
  2: 2900,
  3: 2705,
  4: 2520,
  5: 2335,
  6: 2150,
  7: 1975,
  8: 1805,
  9: 1635,
  10: 1475,
  11: 1320,
  12: 1170,
  13: 1025,
  14: 890,
  15: 760,
  16: 640,
  17: 530,
  18: 435,
  19: 355,
  20: 300,
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
};

/**
 * Таблица уровней по умолчанию. Совпадает с исторической формулой
 * (N-1)² × 100, поэтому уровни уже начисленных игроков не изменятся.
 */
export const DEFAULT_LEVEL_THRESHOLDS: { level: number; requiredXp: number }[] = Array.from(
  { length: 30 },
  (_, index) => {
    const level = index + 1;
    return { level, requiredXp: Math.pow(level - 1, 2) * 100 };
  },
);

/** Ключ настройки XP для конкретного места в турнире (1–20). */
export function xpSettingKeyForPlace(place: number): XpSettingKey | null {
  if (place === 1) return XpSettingKey.TOURNAMENT_WIN;
  if (place >= 2 && place <= 20) {
    return `PLACE_${place}` as XpSettingKey;
  }
  return null;
}

export interface PlaceRatingRow {
  place: number;
  points: number;
  diff: number | null;
}

/** Собирает шкалу рейтинга 1–20 из карты настроек XP. */
export function buildPlaceRatingScale(
  settings: Partial<Record<XpSettingKey, number>>,
): { rows: PlaceRatingRow[]; totalPoints: number } {
  const rows: PlaceRatingRow[] = [];

  for (let place = 1; place <= 20; place += 1) {
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
