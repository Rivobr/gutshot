import {
  DEFAULT_PLACE_BANDS,
  DEFAULT_PLACE_RATING,
  DEFAULT_XP_SETTINGS,
  xpSettingKeyForPlace,
} from './xp-defaults.constants';
import type { XpSettingKey } from '@prisma/client';

/** Fallback, если настройка места отсутствует в БД. */
export function getXpForPlace(place: number): number {
  if (!Number.isFinite(place) || place < 1) {
    return 0;
  }

  const key = xpSettingKeyForPlace(place);
  if (!key) {
    return 0;
  }

  if (place <= 30) {
    return DEFAULT_PLACE_RATING[place] ?? DEFAULT_XP_SETTINGS[key] ?? 0;
  }

  if (key === 'PLACE_31_40') return DEFAULT_PLACE_BANDS.PLACE_31_40;
  if (key === 'PLACE_41_50') return DEFAULT_PLACE_BANDS.PLACE_41_50;
  return DEFAULT_PLACE_BANDS.PLACE_51_PLUS;
}

/** XP за место с учётом актуальных настроек из БД. */
export function getXpForPlaceFromSettings(
  place: number,
  settings: Partial<Record<XpSettingKey, number>>,
): number {
  const key = xpSettingKeyForPlace(place);
  if (!key) {
    return 0;
  }
  return settings[key] ?? getXpForPlace(place);
}
