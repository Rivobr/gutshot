import { useEffect, useState } from 'react';
import type { TournamentLiveState } from '@gutshot/types';

function formatSeconds(total: number | null | undefined): string {
  if (total == null || total < 0) return '—';
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Локальный отсчёт до levelEndsAt: между запросами к серверу таймер
 * идёт секунда в секунду, поправка — на расхождение часов телефона.
 */
function useCountdown(
  endsAt: string | null | undefined,
  serverTime: string | null | undefined,
  running: boolean,
  fallback: number | null | undefined,
): number | null {
  const [left, setLeft] = useState<number | null>(fallback ?? null);

  useEffect(() => {
    if (!endsAt) {
      setLeft(fallback ?? null);
      return;
    }

    const skew = serverTime ? new Date(serverTime).getTime() - Date.now() : 0;
    const target = new Date(endsAt).getTime();
    const tick = () => setLeft(Math.max(0, Math.round((target - (Date.now() + skew)) / 1000)));
    tick();

    if (!running) {
      return;
    }

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt, serverTime, running, fallback]);

  return left;
}

export function TournamentLiveBlock({ live }: { live: TournamentLiveState }): JSX.Element {
  const levelLeft = useCountdown(
    live.levelEndsAt,
    live.serverTime,
    live.isRunning,
    live.levelSecondsLeft,
  );

  if (!live.isRunning && live.level == null && live.smallBlind == null) {
    return <></>;
  }

  const blinds =
    live.smallBlind != null && live.bigBlind != null
      ? `${live.smallBlind}/${live.bigBlind}${live.ante ? ` (${live.ante})` : ''}`
      : '—';

  // Перерыв: до перерыва показывать нечего, важнее «сколько ещё отдыхаем».
  const breakLeft = live.isBreak
    ? levelLeft
    : live.nextBreakInSec != null && live.levelEndsAt
      ? Math.max(0, live.nextBreakInSec - ((live.levelSecondsLeft ?? 0) - (levelLeft ?? 0)))
      : live.nextBreakInSec;

  return (
    <div
      className="vip-card rounded-[18px] p-4"
      style={{
        border: '1px solid rgba(199,154,61,0.28)',
        background: 'linear-gradient(145deg, rgba(199,154,61,0.12), rgba(14,12,9,0.96))',
      }}
    >
      <p
        className="sans uppercase mb-3"
        style={{ fontSize: 10, color: '#C89A3D', letterSpacing: '0.16em', fontWeight: 600 }}
      >
        {live.isBreak ? '● Перерыв' : live.isRunning ? '● Идёт турнир' : 'Live'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <LiveStat
          label="Уровень"
          value={live.isBreak ? 'Перерыв' : live.level != null ? String(live.level) : '—'}
        />
        <LiveStat label="Блайнды" value={live.isBreak ? '—' : blinds} />
        <LiveStat
          label={live.isBreak ? 'До продолжения' : 'До смены'}
          value={formatSeconds(levelLeft)}
        />
        <LiveStat
          label={live.isBreak ? 'Играют' : 'До перерыва'}
          value={
            live.isBreak
              ? live.playersIn != null
                ? String(live.playersIn)
                : '—'
              : formatSeconds(breakLeft)
          }
        />
      </div>
      {!live.isBreak && live.playersIn != null && (
        <p className="sans mt-3" style={{ fontSize: 11, color: '#8A7A62' }}>
          Играют: {live.playersIn}
        </p>
      )}
    </div>
  );
}

function LiveStat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <p
        className="sans uppercase"
        style={{ fontSize: 9, color: '#6B614E', letterSpacing: '0.12em' }}
      >
        {label}
      </p>
      <p className="serif font-semibold mt-1" style={{ fontSize: 18, color: '#F5EDD6' }}>
        {value}
      </p>
    </div>
  );
}
