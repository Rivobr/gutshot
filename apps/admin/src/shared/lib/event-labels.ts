import type { PlayerEventType, ScannerEventType, XpSettingKey } from '@gutshot/types';
import { MAX_SCORING_PLACE, PLACE_RATING_KEYS, RATING_REWARD_KEYS } from '@gutshot/types';

export const SCANNER_EVENTS: { value: ScannerEventType; label: string; icon: string }[] = [
  { value: 'ARRIVED', label: 'Пришёл', icon: '✅' },
  { value: 'ELIMINATED', label: 'Вылет', icon: '❌' },
  { value: 'RE_ENTRY', label: 'Ре-энтри', icon: '🔄' },
  { value: 'BOUNTY', label: 'Баунти', icon: '🎯' },
  { value: 'FOUR_OF_A_KIND', label: 'Каре', icon: '🃏' },
  { value: 'STRAIGHT_FLUSH', label: 'Стрит-флеш', icon: '🔥' },
  { value: 'ROYAL_FLUSH', label: 'Роял-флеш', icon: '👑' },
  { value: 'SHORT_STACK_WIN', label: 'Победа с <10 BB', icon: '⚡' },
  { value: 'TUTORIAL_COMPLETED', label: 'Обучение', icon: '🎓' },
  { value: 'FRIEND_REFERRED', label: 'Привёл друга', icon: '🤝' },
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
  TOURNAMENT_RESULT: 'Результат турнира (XP за место)',
  ACHIEVEMENT_UNLOCKED: 'Достижение получено',
  WEEKLY_RATING_REWARD: 'Награда недельного рейтинга',
  MONTHLY_FINAL_REWARD: 'Награда финала месяца',
  TUTORIAL_COMPLETED: 'Пройдено обучение',
  FRIEND_REFERRED: 'Приведён друг',
  SHORT_STACK_WIN: 'Победа со стека менее 10 BB',
};

const PLACE_LABELS = Object.fromEntries(
  PLACE_RATING_KEYS.map((key, index) => [key, `${index + 1} место — XP`]),
) as Partial<Record<XpSettingKey, string>>;

export const XP_SETTING_LABELS: Record<XpSettingKey, string> = {
  ...(PLACE_LABELS as Record<XpSettingKey, string>),
  ATTENDANCE: 'Посещение турнира (XP)',
  ELIMINATION: 'Вылет (XP)',
  RE_ENTRY: 'Ре-энтри (XP)',
  BOUNTY: 'Баунти (очки рейтинга)',
  FOUR_OF_A_KIND: 'Каре (XP)',
  STRAIGHT_FLUSH: 'Стрит-флеш (XP)',
  ROYAL_FLUSH: 'Роял-флеш (XP)',
  TOURNAMENT_WIN: '1 место — XP',
  PLACE_31_40: '31–40 место — XP',
  PLACE_41_50: '41–50 место — XP',
  PLACE_51_PLUS: '51+ место — XP',
  WEEKLY_TOP_1: 'Неделя: 1 место',
  WEEKLY_TOP_2: 'Неделя: 2 место',
  WEEKLY_TOP_3: 'Неделя: 3 место',
  MONTHLY_TOP_1: 'Финал месяца: 1 место',
  MONTHLY_TOP_2: 'Финал месяца: 2 место',
  MONTHLY_TOP_3: 'Финал месяца: 3 место',
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

/** Шкала XP за места 1–30. */
export const XP_PLACE_SETTING_ORDER: XpSettingKey[] = [...PLACE_RATING_KEYS];

/** Диапазоны мест ниже топ-30. */
export const XP_PLACE_BAND_ORDER: XpSettingKey[] = ['PLACE_31_40', 'PLACE_41_50', 'PLACE_51_PLUS'];

/** Награды по итогам месяца. */
export const XP_REWARD_SETTING_ORDER: XpSettingKey[] = [...RATING_REWARD_KEYS];

/** Полный порядок для сохранения всех ключей. */
export const XP_SETTING_ORDER: XpSettingKey[] = [
  ...XP_EVENT_SETTING_ORDER,
  ...XP_PLACE_SETTING_ORDER,
  ...XP_PLACE_BAND_ORDER,
  ...XP_REWARD_SETTING_ORDER,
];

export { MAX_SCORING_PLACE };

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
