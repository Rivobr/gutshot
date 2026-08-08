/** Единое отображаемое имя в админке: клубный ник → Telegram → @username. */
export function displayPlayerName(user: {
  nickname?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  telegramId?: string | number | null;
}): string {
  if (user.nickname?.trim()) {
    return user.nickname.trim();
  }

  const fromName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fromName) {
    return fromName;
  }

  if (user.username?.trim()) {
    return `@${user.username.trim()}`;
  }

  if (user.telegramId != null && String(user.telegramId).trim()) {
    return `Игрок ${user.telegramId}`;
  }

  return 'Игрок';
}
