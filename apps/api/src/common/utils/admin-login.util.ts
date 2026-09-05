/** Невидимые символы с телефона: NBSP, BOM, zero-width. */
function stripInvisible(value: string): string {
  return value.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, '');
}

/**
 * Логины в базе — латиницей (Sergei / Tima / Misha).
 * С телефона часто вводят кириллицу или другую транслитерацию.
 */
const ADMIN_LOGIN_ALIASES: Record<string, string> = {
  sergei: 'Sergei',
  sergey: 'Sergei',
  sergej: 'Sergei',
  сергей: 'Sergei',
  сережа: 'Sergei',
  серёжа: 'Sergei',
  tima: 'Tima',
  tim: 'Tima',
  тима: 'Tima',
  тимофей: 'Tima',
  misha: 'Misha',
  миша: 'Misha',
  михаил: 'Misha',
};

export function normalizeAdminLogin(raw: string): string {
  const cleaned = stripInvisible(String(raw ?? ''))
    .trim()
    .toLowerCase();
  const local = cleaned.split('@')[0] ?? '';
  return ADMIN_LOGIN_ALIASES[local] ?? local;
}

export function normalizeAdminPassword(raw: string): string {
  return stripInvisible(String(raw ?? '')).trim();
}
