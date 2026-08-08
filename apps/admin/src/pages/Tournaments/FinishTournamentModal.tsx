import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AdminTournamentRegistration } from '@gutshot/types';
import { Button } from '@gutshot/ui';
import { useFinishTournament } from '../../entities/tournament';
import { displayPlayerName } from '../../shared/lib/display-name';

export interface FinishTournamentModalProps {
  open: boolean;
  tournamentId: string;
  registrations: AdminTournamentRegistration[];
  onClose: () => void;
}

export function FinishTournamentModal({
  open,
  tournamentId,
  registrations,
  onClose,
}: FinishTournamentModalProps): JSX.Element {
  const finishTournament = useFinishTournament();
  const players = useMemo(
    () =>
      registrations
        .filter((item) => ['REGISTERED', 'CHECKED_IN', 'PLAYING', 'FINISHED'].includes(item.status))
        .slice()
        .sort((a, b) => {
          if (a.place != null && b.place != null) {
            return a.place - b.place;
          }
          if (a.place != null) {
            return -1;
          }
          if (b.place != null) {
            return 1;
          }
          return 0;
        }),
    [registrations],
  );
  const [places, setPlaces] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    const next: Record<string, string> = {};
    players.forEach((player) => {
      next[player.id] = player.place != null ? String(player.place) : '';
    });
    setPlaces(next);
  }, [open, players]);

  const missingPlaces = players.filter((player) => {
    const value = Number(places[player.id]);
    return !Number.isInteger(value) || value < 1;
  });

  const onSubmit = () => {
    const results = players.map((player) => ({
      registrationId: player.id,
      place: Number(places[player.id]),
    }));

    if (results.some((item) => !Number.isInteger(item.place) || item.place < 1)) {
      return;
    }

    const unique = new Set(results.map((item) => item.place));
    if (unique.size !== results.length) {
      return;
    }

    finishTournament.mutate(
      { id: tournamentId, results },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  const placeValues = players.map((player) => Number(places[player.id]));
  const hasDuplicatePlaces =
    placeValues.filter((value) => Number.isInteger(value) && value >= 1).length !==
    new Set(placeValues.filter((value) => Number.isInteger(value) && value >= 1)).size;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-medium">Завершить турнир</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Места, которые уже проставили во время игры, подставлены автоматически. Можно
              поправить перед начислением XP.
            </p>

            {players.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет игроков для завершения</p>
            ) : (
              <div className="flex flex-col gap-2">
                {players.map((player) => (
                  <label
                    key={player.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <span className="text-sm">{displayPlayerName(player.user)}</span>
                    <input
                      type="number"
                      min={1}
                      className="w-20 rounded-md border border-border bg-secondary px-2 py-1.5 text-sm"
                      value={places[player.id] ?? ''}
                      onChange={(event) =>
                        setPlaces((prev) => ({ ...prev, [player.id]: event.target.value }))
                      }
                    />
                  </label>
                ))}
              </div>
            )}

            {missingPlaces.length > 0 && (
              <p className="mt-3 text-sm text-amber-500">
                Не указаны места у {missingPlaces.length} игроков
                {missingPlaces.length <= 5
                  ? `: ${missingPlaces.map((item) => displayPlayerName(item.user)).join(', ')}`
                  : ''}
              </p>
            )}

            {hasDuplicatePlaces && (
              <p className="mt-3 text-sm text-destructive">Места не должны повторяться</p>
            )}

            {finishTournament.isError && (
              <p className="mt-3 text-sm text-destructive">
                Не удалось завершить турнир. Проверьте места и статус.
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Отмена
              </Button>
              <Button
                type="button"
                isLoading={finishTournament.isPending}
                disabled={players.length === 0 || missingPlaces.length > 0 || hasDuplicatePlaces}
                onClick={onSubmit}
              >
                Завершить и начислить очки
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
