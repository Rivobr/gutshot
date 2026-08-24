/** Нормализация телефона РФ к формату +7XXXXXXXXXX. */
export function normalizeRussianPhone(raw: string): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+7${digits}`;
  }

  return null;
}

/** Маска для логов/писем: +7 999 •••-11-99 */
export function maskPhone(phone: string): string {
  const m = phone.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+7 ${m[1]} •••-${m[3]}-${m[4]}` : phone;
}
