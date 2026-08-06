import { useEffect, useMemo, useState } from 'react';
import { Button, Card } from '@gutshot/ui';
import type { BlindLevel } from '@gutshot/types';
import {
  useApplyDefaultStructure,
  useClockAction,
  useSaveBlindStructure,
  useSetClockLevel,
  useTournamentClock,
} from '../../entities/tournament';
import { env } from '../../shared/config/env';

function formatClock(totalSec: number | null | undefined): string {
  if (totalSec == null || totalSec < 0) return '—';
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Локальный тик между запросами, чтобы таймер шёл секунда в секунду. */
function useCountdown(endsAt: string | null | undefined, running: boolean): number | null {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setLeft(null);
      return;
    }

    const target = new Date(endsAt).getTime();
    const tick = () => setLeft(Math.max(0, Math.round((target - Date.now()) / 1000)));
    tick();

    if (!running) {
      return;
    }

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt, running]);

  return left;
}

export function TournamentClockPanel({ tournamentId }: { tournamentId: string }): JSX.Element {
  const { data, isLoading } = useTournamentClock(tournamentId);
  const saveStructure = useSaveBlindStructure(tournamentId);
  const applyDefault = useApplyDefaultStructure(tournamentId);
  const clockAction = useClockAction(tournamentId);
  const setLevel = useSetClockLevel(tournamentId);

  const [draft, setDraft] = useState<BlindLevel[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (data?.levels && !editing) {
      setDraft(data.levels);
    }
  }, [data?.levels, editing]);

  const clock = data?.clock;
  const running = clock?.status === 'RUNNING';
  const secondsLeft = useCountdown(clock?.levelEndsAt, running);
  const secondsToBreak = useCountdown(clock?.breakAt, running);

  const tvUrl = useMemo(
    // Прямой IP: tv.* за Cloudflare — без VPN на Xiaomi часто не открывается.
    () => `${env.tvBoardUrl}/?tournament=${tournamentId}`,
    [tournamentId],
  );

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">Загружаем часы…</p>
      </Card>
    );
  }

  const levels = data?.levels ?? [];
  const hasStructure = levels.length > 0;

  const updateDraft = (idx: number, patch: Partial<BlindLevel>) => {
    setEditing(true);
    setDraft((prev) => prev.map((level, i) => (i === idx ? { ...level, ...patch } : level)));
  };

  const addLevel = (isBreak: boolean) => {
    setEditing(true);
    setDraft((prev) => {
      const lastPlay = [...prev].reverse().find((level) => !level.isBreak);
      return [
        ...prev,
        {
          idx: prev.length,
          isBreak,
          smallBlind: isBreak ? null : (lastPlay?.smallBlind ?? 25) * 2,
          bigBlind: isBreak ? null : (lastPlay?.bigBlind ?? 50) * 2,
          ante: null,
          durationSec: isBreak ? 600 : (lastPlay?.durationSec ?? 1200),
        },
      ];
    });
  };

  const removeLevel = (idx: number) => {
    setEditing(true);
    setDraft((prev) => prev.filter((_, i) => i !== idx).map((level, i) => ({ ...level, idx: i })));
  };

  return (
    <Card className="gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">Турнирные часы</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Структура задаётся один раз. После старта блайнды и перерывы переключаются сами — на
            TV-табло и в Mini App.
          </p>
        </div>
        <a
          href={tvUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
        >
          Открыть TV-табло →
        </a>
      </div>

      {hasStructure && clock && (
        <div className="rounded-lg border border-border bg-secondary/40 p-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat
              label={clock.current?.isBreak ? 'Перерыв' : 'Уровень'}
              value={
                clock.current?.isBreak
                  ? 'Перерыв'
                  : clock.current?.number != null
                    ? String(clock.current.number)
                    : '—'
              }
            />
            <Stat
              label="Блайнды"
              value={
                clock.current?.isBreak
                  ? '—'
                  : clock.current?.smallBlind != null
                    ? `${clock.current.smallBlind}/${clock.current.bigBlind}${
                        clock.current.ante ? ` (${clock.current.ante})` : ''
                      }`
                    : '—'
              }
            />
            <Stat label="До смены" value={formatClock(secondsLeft ?? clock.secondsLeft)} />
            <Stat label="До перерыва" value={formatClock(secondsToBreak ?? clock.secondsToBreak)} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {clock.status !== 'RUNNING' && clock.status !== 'PAUSED' && (
              <Button onClick={() => clockAction.mutate('start')} isLoading={clockAction.isPending}>
                Запустить часы
              </Button>
            )}
            {clock.status === 'RUNNING' && (
              <Button
                variant="secondary"
                onClick={() => clockAction.mutate('pause')}
                isLoading={clockAction.isPending}
              >
                Пауза
              </Button>
            )}
            {clock.status === 'PAUSED' && (
              <Button
                onClick={() => clockAction.mutate('resume')}
                isLoading={clockAction.isPending}
              >
                Продолжить
              </Button>
            )}
            {clock.current && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setLevel.mutate(Math.max(0, clock.current!.idx - 1))}
                  isLoading={setLevel.isPending}
                >
                  ← Уровень назад
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setLevel.mutate(clock.current!.idx + 1)}
                  isLoading={setLevel.isPending}
                >
                  Уровень вперёд →
                </Button>
              </>
            )}
            {clock.status !== 'IDLE' && (
              <Button
                variant="ghost"
                onClick={() => clockAction.mutate('stop')}
                isLoading={clockAction.isPending}
              >
                Сбросить
              </Button>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Структура блайндов</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => applyDefault.mutate('club')}
              isLoading={applyDefault.isPending}
            >
              Шаблон клуба
            </Button>
            <Button
              variant="secondary"
              onClick={() => applyDefault.mutate('classic20')}
              isLoading={applyDefault.isPending}
            >
              Шаблон 20 мин
            </Button>
            <Button variant="secondary" onClick={() => addLevel(false)}>
              + Уровень
            </Button>
            <Button variant="secondary" onClick={() => addLevel(true)}>
              + Перерыв
            </Button>
          </div>
        </div>

        {draft.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Структуры пока нет. Возьмите шаблон или добавьте уровни вручную.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">#</th>
                  <th>SB</th>
                  <th>BB</th>
                  <th>Ante</th>
                  <th>Мин</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {draft.map((level, idx) => (
                  <tr
                    key={idx}
                    className={`border-t border-border ${
                      clock?.current?.idx === idx ? 'bg-secondary/60' : ''
                    }`}
                  >
                    <td className="py-2 pr-2">
                      {level.isBreak ? (
                        <span className="text-muted-foreground">Перерыв</span>
                      ) : (
                        draft.filter((item, i) => !item.isBreak && i <= idx).length
                      )}
                    </td>
                    <td className="pr-2">
                      <NumberCell
                        disabled={level.isBreak}
                        value={level.smallBlind}
                        onChange={(smallBlind) => updateDraft(idx, { smallBlind })}
                      />
                    </td>
                    <td className="pr-2">
                      <NumberCell
                        disabled={level.isBreak}
                        value={level.bigBlind}
                        onChange={(bigBlind) => updateDraft(idx, { bigBlind })}
                      />
                    </td>
                    <td className="pr-2">
                      <NumberCell
                        disabled={level.isBreak}
                        value={level.ante}
                        onChange={(ante) => updateDraft(idx, { ante })}
                      />
                    </td>
                    <td className="pr-2">
                      <NumberCell
                        value={Math.round(level.durationSec / 60)}
                        onChange={(minutes) =>
                          updateDraft(idx, { durationSec: Math.max(1, minutes ?? 1) * 60 })
                        }
                      />
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => removeLevel(idx)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {draft.length > 0 && (
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => saveStructure.mutate(draft, { onSuccess: () => setEditing(false) })}
              isLoading={saveStructure.isPending}
            >
              Сохранить структуру
            </Button>
            {editing && (
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft(levels);
                  setEditing(false);
                }}
              >
                Отменить
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function NumberCell({
  value,
  onChange,
  disabled,
}: {
  value?: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <input
      type="number"
      disabled={disabled}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
      className="w-20 rounded-md border border-border bg-secondary px-2 py-1.5 disabled:opacity-40"
    />
  );
}
