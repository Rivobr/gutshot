/**
 * Владельцы клуба: XP и турниры как у всех, в таблицах рейтинга их нет никогда.
 * Ник в Telegram без @, сравнение без регистра.
 */
export const RATING_EXCLUDED_USERNAMES = ['ingra_admin', 'gargona52'] as const;

export function isRatingExcludedUsername(username?: string | null): boolean {
  if (!username) {
    return false;
  }
  const normalized = username.trim().replace(/^@/, '').toLowerCase();
  return (RATING_EXCLUDED_USERNAMES as readonly string[]).includes(normalized);
}
