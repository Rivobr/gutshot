import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AdminTournamentRegistration } from '@gutshot/types';
import { Button } from '@gutshot/ui';
import { useFinishTournament } from '../../entities/tournament';

function displayName(user: AdminTournamentRegistration['user'] & { nickname?: string | null }): string {
  if (user.nickname?.trim()) {
    return user.nickname.trim();
  }
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return name || user.username || 'Игрок';
}

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
  const players = registrations.filter((item) =>
    ['REGISTERED', 'CHECKED_IN', 'PLAYING', 'FINISHED'].includes(item.status),
  );
  const [places, setPlaces] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    const next: Record<string, string> = {};
    players.forEach((player, index) => {
      next[player.id] = String(index + 1);
    });
    setPlaces(next);
  }, [open, registrations]);

  const onSubmit = () => {
    const results = players.map((player) => ({
      registrationId: player.id,
      place: Number(places[player.id]),
    }));

    if (results.some((item) => !Number.isInteger(item.place) || item.place < 1)) {
      return;
    }

    finishTournament.mutate(
      { id: tournamentId, results },
      {
        onSuccess: () => onClose(),
      },
    );
  };

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
              Укажите места игроков — очки рейтинга начислятся по шкале настроек.
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
                    <span className="text-sm">{displayName(player.user)}</span>
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
                disabled={players.length === 0}
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
