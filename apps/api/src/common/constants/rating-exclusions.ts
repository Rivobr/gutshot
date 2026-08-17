/**
 * Скрыты только из недельного / финального рейтинга очков — в глобальном XP они есть.
 * Ник в Telegram без @, сравнение без регистра.
 * ingra_admin / gargona52 — владельцы клуба; geosablin — Георгий Саблин (по запросу клуба).
 */
export const RATING_EXCLUDED_USERNAMES = ['ingra_admin', 'gargona52', 'geosablin'] as const;

export function isRatingExcludedUsername(username?: string | null): boolean {
  if (!username) {
    return false;
  }
  const normalized = username.trim().replace(/^@/, '').toLowerCase();
  return (RATING_EXCLUDED_USERNAMES as readonly string[]).includes(normalized);
}
