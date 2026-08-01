import type { TournamentStatus } from '@gutshot/types';

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  DRAFT: 'Черновик',
  REGISTRATION_OPEN: 'Регистрация открыта',
  REGISTRATION_CLOSED: 'Регистрация закрыта',
  IN_PROGRESS: 'Идёт турнир',
  FINISHED: 'Завершён',
  ARCHIVED: 'В архиве',
};

export function tournamentStatusLabel(status: string): string {
  return TOURNAMENT_STATUS_LABELS[status as TournamentStatus] ?? status;
}
