import { XpSettingKey } from '@prisma/client';

/**
 * Значения XP по умолчанию. Используются для первичного заполнения таблицы
 * настроек и как fallback, если ключ по какой-то причине отсутствует в БД.
 * Значения мест 1–3 согласованы с исторической таблицей XP_REWARDS.
 */
export const DEFAULT_XP_SETTINGS: Record<XpSettingKey, number> = {
  ATTENDANCE: 100,
  ELIMINATION: 50,
  RE_ENTRY: 0,
  BOUNTY: 75,
  FOUR_OF_A_KIND: 150,
  STRAIGHT_FLUSH: 300,
  ROYAL_FLUSH: 1000,
  TOURNAMENT_WIN: 350,
  PLACE_2: 250,
  PLACE_3: 180,
  PLACE_4: 130,
  PLACE_5: 130,
  PLACE_6: 130,
  PLACE_7: 130,
  PLACE_8: 130,
  PLACE_9: 100,
  PLACE_10: 100,
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

/** Ключ настройки XP для конкретного места в турнире. */
export function xpSettingKeyForPlace(place: number): XpSettingKey | null {
  if (place === 1) return XpSettingKey.TOURNAMENT_WIN;
  if (place >= 2 && place <= 10) {
    return `PLACE_${place}` as XpSettingKey;
  }
  return null;
}
