import { useEffect, useRef, useState } from 'react';
import type { TournamentBoard } from '@gutshot/types';

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1';
/** Частый опрос для ноутбука по HDMI: пауза/смена уровня почти сразу. */
const POLL_OK_MS = 2_000;
const POLL_FAIL_MS = 3_000;

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
  const boardRef = useRef<TournamentBoard | null>(null);
  const timerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const schedule = (ms: number) => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        void load();
      }, ms);
    };

    const requestWakeLock = async () => {
      try {
        if (document.visibilityState !== 'visible') return;
        const wakeLock = (
          navigator as Navigator & {
            wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
          }
        ).wakeLock;
        if (!wakeLock?.request) return;
        const lock = await wakeLock.request('screen');
        wakeLockRef.current = lock;
      } catch {
        // Браузер/ОС может отказать — табло всё равно работает.
      }
    };

    const load = async () => {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 8_000);
        const response = await fetch(boardUrl(), {
          cache: 'no-store',
          signal: controller.signal,
        });
        window.clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`http ${response.status}`);
        }

        const payload = (await response.json()) as { data?: TournamentBoard | null };
        if (cancelled) return;

        const next = payload.data ?? null;
        // Не затираем удачное состояние пустым ответом при кратком сбое API.
        if (next?.clock || !boardRef.current) {
          boardRef.current = next;
          setBoard(next);
          if (next?.clock?.serverTime) {
            setSkew(new Date(next.clock.serverTime).getTime() - Date.now());
          }
        }

        failures.current = 0;
        setOffline(false);
        schedule(POLL_OK_MS);
      } catch {
        if (cancelled) return;
        failures.current += 1;
        // Одна сетевая осечка не должна гасить табло — показываем последнее состояние.
        if (failures.current >= 3) {
          setOffline(true);
        }
        schedule(POLL_FAIL_MS);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock();
        void load();
      }
    };

    const onOnline = () => {
      failures.current = 0;
      void load();
    };

    void requestWakeLock();
    void load();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onOnline);

    return () => {
      cancelled = true;
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
      }
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onOnline);
      void wakeLockRef.current?.release().catch(() => undefined);
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
