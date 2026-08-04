import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Card } from '@gutshot/ui';
import type { TournamentLiveState } from '@gutshot/types';
import { useUpdateTournamentLive } from '../../entities/tournament';

interface LiveFormValues {
  isRunning: boolean;
  level?: number;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
  nextBreakInSec?: number;
  playersIn?: number;
}

export function TournamentLivePanel({
  tournamentId,
  live,
}: {
  tournamentId: string;
  live?: TournamentLiveState | null;
}): JSX.Element {
  const { register, handleSubmit, reset } = useForm<LiveFormValues>();
  const updateLive = useUpdateTournamentLive();

  useEffect(() => {
    reset({
      isRunning: live?.isRunning ?? false,
      level: live?.level ?? undefined,
      smallBlind: live?.smallBlind ?? undefined,
      bigBlind: live?.bigBlind ?? undefined,
      ante: live?.ante ?? undefined,
      nextBreakInSec: live?.nextBreakInSec ?? undefined,
      playersIn: live?.playersIn ?? undefined,
    });
  }, [live, reset]);

  const onSubmit = (values: LiveFormValues) => {
    updateLive.mutate({
      id: tournamentId,
      payload: {
        isRunning: Boolean(values.isRunning),
        level: values.level != null ? Number(values.level) : undefined,
        smallBlind: values.smallBlind != null ? Number(values.smallBlind) : undefined,
        bigBlind: values.bigBlind != null ? Number(values.bigBlind) : undefined,
        ante: values.ante != null ? Number(values.ante) : undefined,
        nextBreakInSec: values.nextBreakInSec != null ? Number(values.nextBreakInSec) : undefined,
        playersIn: values.playersIn != null ? Number(values.playersIn) : undefined,
      },
    });
  };

  return (
    <Card className="gap-4">
      <div>
        <h2 className="font-medium">Ручной режим</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Запасной вариант, когда структура блайндов не задана: значения показываются в Mini App как
          есть. Если часы запущены, приоритет у них.
        </p>
      </div>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" {...register('isRunning')} />
          Турнир идёт (live)
        </label>
        <input
          type="number"
          className="rounded-md border border-border bg-secondary px-3 py-2.5"
          placeholder="Уровень"
          {...register('level')}
        />
        <input
          type="number"
          className="rounded-md border border-border bg-secondary px-3 py-2.5"
          placeholder="Играют сейчас"
          {...register('playersIn')}
        />
        <input
          type="number"
          className="rounded-md border border-border bg-secondary px-3 py-2.5"
          placeholder="SB"
          {...register('smallBlind')}
        />
        <input
          type="number"
          className="rounded-md border border-border bg-secondary px-3 py-2.5"
          placeholder="BB"
          {...register('bigBlind')}
        />
        <input
          type="number"
          className="rounded-md border border-border bg-secondary px-3 py-2.5"
          placeholder="Ante"
          {...register('ante')}
        />
        <input
          type="number"
          className="rounded-md border border-border bg-secondary px-3 py-2.5"
          placeholder="До перерыва (сек)"
          {...register('nextBreakInSec')}
        />
        <div className="sm:col-span-2">
          <Button type="submit" isLoading={updateLive.isPending}>
            Сохранить live
          </Button>
        </div>
      </form>
    </Card>
  );
}
