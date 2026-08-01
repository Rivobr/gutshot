export function displayNameOf(user: {
  nickname?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}): string {
  if (user.nickname?.trim()) {
    return user.nickname.trim();
  }

  const fromName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fromName) {
    return fromName;
  }

  if (user.username?.trim()) {
    return user.username.trim();
  }

  return 'Игрок';
}
