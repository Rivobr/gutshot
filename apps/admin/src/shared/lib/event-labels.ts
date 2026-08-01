import type { PlayerEventType, ScannerEventType, XpSettingKey } from '@gutshot/types';
import { PLACE_RATING_KEYS } from '@gutshot/types';

export const SCANNER_EVENTS: { value: ScannerEventType; label: string; icon: string }[] = [
  { value: 'ARRIVED', label: 'Пришёл', icon: '✅' },
  { value: 'ELIMINATED', label: 'Вылет', icon: '❌' },
  { value: 'RE_ENTRY', label: 'Ре-энтри', icon: '🔄' },
  { value: 'BOUNTY', label: 'Баунти', icon: '🎯' },
  { value: 'FOUR_OF_A_KIND', label: 'Каре', icon: '🃏' },
  { value: 'STRAIGHT_FLUSH', label: 'Стрит-флеш', icon: '🔥' },
  { value: 'ROYAL_FLUSH', label: 'Роял-флеш', icon: '👑' },
];

export const PLAYER_EVENT_LABELS: Record<PlayerEventType, string> = {
  TOURNAMENT_REGISTRATION: 'Регистрация на турнир',
  TOURNAMENT_CANCELLED: 'Отмена регистрации',
  ARRIVED: 'Явка на турнир',
  ELIMINATED: 'Вылет из турнира',
  RE_ENTRY: 'Ре-энтри',
  BOUNTY: 'Баунти',
  FOUR_OF_A_KIND: 'Каре',
  STRAIGHT_FLUSH: 'Стрит-флеш',
  ROYAL_FLUSH: 'Роял-флеш',
  XP_CHANGE: 'Изменение XP',
  LEVEL_UP: 'Повышение уровня',
  TOURNAMENT_RESULT: 'Результат турнира',
  ACHIEVEMENT_UNLOCKED: 'Достижение получено',
};

export const XP_SETTING_LABELS: Record<XpSettingKey, string> = {
  ATTENDANCE: 'Посещение турнира',
  ELIMINATION: 'Вылет',
  RE_ENTRY: 'Ре-энтри',
  BOUNTY: 'Баунти',
  FOUR_OF_A_KIND: 'Каре',
  STRAIGHT_FLUSH: 'Стрит-флеш',
  ROYAL_FLUSH: 'Роял-флеш',
  TOURNAMENT_WIN: '1 место (победа)',
  PLACE_2: '2 место',
  PLACE_3: '3 место',
  PLACE_4: '4 место',
  PLACE_5: '5 место',
  PLACE_6: '6 место',
  PLACE_7: '7 место',
  PLACE_8: '8 место',
  PLACE_9: '9 место',
  PLACE_10: '10 место',
  PLACE_11: '11 место',
  PLACE_12: '12 место',
  PLACE_13: '13 место',
  PLACE_14: '14 место',
  PLACE_15: '15 место',
  PLACE_16: '16 место',
  PLACE_17: '17 место',
  PLACE_18: '18 место',
  PLACE_19: '19 место',
  PLACE_20: '20 место',
};

/** Прочие начисления (не шкала мест). */
export const XP_EVENT_SETTING_ORDER: XpSettingKey[] = [
  'ATTENDANCE',
  'ELIMINATION',
  'RE_ENTRY',
  'BOUNTY',
  'FOUR_OF_A_KIND',
  'STRAIGHT_FLUSH',
  'ROYAL_FLUSH',
];

/** Шкала рейтинга 1–20. */
export const XP_PLACE_SETTING_ORDER: XpSettingKey[] = [...PLACE_RATING_KEYS];

/** Полный порядок для сохранения всех ключей. */
export const XP_SETTING_ORDER: XpSettingKey[] = [
  ...XP_EVENT_SETTING_ORDER,
  ...XP_PLACE_SETTING_ORDER,
];

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPoints(value: number): string {
  return value.toLocaleString('ru-RU');
}
