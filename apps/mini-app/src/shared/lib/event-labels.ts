import type { PlayerEventType } from '@gutshot/types';

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
  XP_CHANGE: 'Изменение опыта',
  LEVEL_UP: 'Новый уровень',
  TOURNAMENT_RESULT: 'Результат турнира',
  ACHIEVEMENT_UNLOCKED: 'Достижение получено',
  WEEKLY_RATING_REWARD: 'Награда недельного рейтинга',
  MONTHLY_FINAL_REWARD: 'Награда финала месяца',
  TUTORIAL_COMPLETED: 'Пройдено обучение',
  FRIEND_REFERRED: 'Приведён друг',
  SHORT_STACK_WIN: 'Победа со стека менее 10 BB',
};

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
