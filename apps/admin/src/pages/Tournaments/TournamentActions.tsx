import type { TournamentStatus } from '@gutshot/types';
import { Button } from '@gutshot/ui';
import { useTournamentAction } from '../../entities/tournament';

export interface TournamentActionsProps {
  tournamentId: string;
  status: TournamentStatus | string;
  onEdit?: () => void;
  onFinish?: () => void;
  onDeleted?: () => void;
  compact?: boolean;
}

export function TournamentActions({
  tournamentId,
  status,
  onEdit,
  onFinish,
  onDeleted,
  compact = false,
}: TournamentActionsProps): JSX.Element {
  const openAction = useTournamentAction('open');
  const closeAction = useTournamentAction('close');
  const startAction = useTournamentAction('start');
  const archiveAction = useTournamentAction('archive');
  const removeAction = useTournamentAction('remove');

  const btn = compact ? 'px-3 py-1.5 text-xs' : undefined;

  const handleDelete = () => {
    const confirmed = window.confirm(
      'Удалить турнир безвозвратно? Регистрации и результаты турнира будут удалены.',
    );
    if (!confirmed) {
      return;
    }

    removeAction.mutate(tournamentId, {
      onSuccess: () => onDeleted?.(),
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {onEdit && (
        <Button variant="secondary" className={btn} onClick={onEdit}>
          Изменить
        </Button>
      )}

      {status === 'DRAFT' && (
        <Button
          className={btn}
          isLoading={openAction.isPending}
          onClick={() => openAction.mutate(tournamentId)}
        >
          Открыть регистрацию
        </Button>
      )}

      {status === 'REGISTRATION_OPEN' && (
        <Button
          variant="secondary"
          className={btn}
          isLoading={closeAction.isPending}
          onClick={() => closeAction.mutate(tournamentId)}
        >
          Закрыть регистрацию
        </Button>
      )}

      {status === 'REGISTRATION_CLOSED' && (
        <Button
          className={btn}
          isLoading={startAction.isPending}
          onClick={() => startAction.mutate(tournamentId)}
        >
          Начать турнир
        </Button>
      )}

      {status === 'IN_PROGRESS' && onFinish && (
        <Button className={btn} onClick={onFinish}>
          Завершить
        </Button>
      )}

      {status !== 'ARCHIVED' && status !== 'IN_PROGRESS' && (
        <Button
          variant="secondary"
          className={btn}
          isLoading={archiveAction.isPending}
          onClick={() => archiveAction.mutate(tournamentId)}
        >
          В архив
        </Button>
      )}

      {status !== 'IN_PROGRESS' && (
        <Button
          variant="destructive"
          className={btn}
          isLoading={removeAction.isPending}
          onClick={handleDelete}
        >
          Удалить
        </Button>
      )}

      {(openAction.isError ||
        closeAction.isError ||
        startAction.isError ||
        archiveAction.isError ||
        removeAction.isError) && (
        <p className="w-full text-sm text-destructive">Не удалось выполнить действие</p>
      )}
    </div>
  );
}
