import { useEffect, useRef, useState } from 'react';
import type { TournamentBoard } from '@gutshot/types';

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1';
const POLL_MS = 10_000;

export interface BoardState {
  board: TournamentBoard | null;
  /** Расхождение часов TV и сервера, мс. Таймеры тикают локально с поправкой. */
  clockSkewMs: number;
  isOffline: boolean;
  isLoading: boolean;
}

function boardUrl(): string {
  const tournamentId = new URLSearchParams(window.location.search).get('tournament');
  return tournamentId
    ? `${API_URL}/public/tournaments/${tournamentId}/board`
    : `${API_URL}/public/tournaments/board`;
}

/** Тянет табло с сервера; между запросами экран считает время сам. */
export function useBoard(): BoardState {
  const [board, setBoard] = useState<TournamentBoard | null>(null);
  const [clockSkewMs, setSkew] = useState(0);
  const [isOffline, setOffline] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const failures = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(boardUrl(), { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`http ${response.status}`);
        }

        const payload = (await response.json()) as { data?: TournamentBoard | null };
        if (cancelled) return;

        const next = payload.data ?? null;
        setBoard(next);
        if (next?.clock.serverTime) {
          setSkew(new Date(next.clock.serverTime).getTime() - Date.now());
        }
        failures.current = 0;
        setOffline(false);
      } catch {
        if (cancelled) return;
        failures.current += 1;
        // Одна сетевая осечка не должна гасить табло — показываем последнее состояние.
        if (failures.current >= 3) {
          setOffline(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    const timer = window.setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return { board, clockSkewMs, isOffline, isLoading };
}

/** Секундный тик до времени endsAt с поправкой на часы сервера. */
export function useCountdown(
  endsAt: string | null | undefined,
  skewMs: number,
  running: boolean,
): number | null {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setLeft(null);
      return;
    }

    const target = new Date(endsAt).getTime();
    const tick = () => setLeft(Math.max(0, Math.round((target - (Date.now() + skewMs)) / 1000)));
    tick();

    if (!running) {
      return;
    }

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt, skewMs, running]);

  return left;
}
