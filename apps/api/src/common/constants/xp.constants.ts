import { DEFAULT_PLACE_RATING } from './xp-defaults.constants';

/** Fallback, если настройка места отсутствует в БД. */
export function getXpForPlace(place: number): number {
  return DEFAULT_PLACE_RATING[place] ?? 0;
}
