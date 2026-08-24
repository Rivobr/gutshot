export function formatDateShort(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Moscow',
  })
    .format(d)
    .replace('.', '');
}

export function formatTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  }).format(d);
}

export function formatWeekRange(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return '';
  const start = new Date(startIso);
  const end = new Date(new Date(endIso).getTime() - 24 * 60 * 60 * 1000 - 1000);
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Moscow',
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function formatPoints(value: number): string {
  return value.toLocaleString('ru-RU');
}

export function displayName(p: {
  nickname?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}): string {
  if (p.nickname) return p.nickname;
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (p.username) return `@${p.username}`;
  return 'Игрок';
}

export function initialsOf(name: string): string {
  return name.slice(0, 1).toUpperCase();
}
