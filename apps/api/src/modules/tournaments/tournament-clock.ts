import type { BlindLevel, ClockStatus, Tournament } from '@prisma/client';

export interface ClockLevelDto {
  idx: number;
  /** Номер игрового уровня (перерывы не нумеруются). */
  number: number | null;
  isBreak: boolean;
  smallBlind: number | null;
  bigBlind: number | null;
  ante: number | null;
  durationSec: number;
}

export interface TournamentClockDto {
  status: ClockStatus;
  isRunning: boolean;
  /** Текущий уровень или перерыв. */
  current: ClockLevelDto | null;
  next: ClockLevelDto | null;
  /** Сколько секунд осталось до смены уровня/конца перерыва. */
  secondsLeft: number | null;
  /** Сколько секунд до начала ближайшего перерыва (0 — перерыв уже идёт). */
  secondsToBreak: number | null;
  /** Момент смены уровня — TV и Mini App тикают локально от него. */
  levelEndsAt: string | null;
  breakAt: string | null;
  playersIn: number | null;
  levelsTotal: number;
  /** Серверное время ответа — клиент компенсирует расхождение часов. */
  serverTime: string;
}

type ClockFields = Pick<
  Tournament,
  'clockStatus' | 'clockStartedAt' | 'clockLevelIdx' | 'clockPausedAt' | 'livePlayersIn'
>;

function toDto(level: BlindLevel, levels: BlindLevel[]): ClockLevelDto {
  const number = level.isBreak
    ? null
    : levels.filter((item) => !item.isBreak && item.idx <= level.idx).length;

  return {
    idx: level.idx,
    number,
    isBreak: level.isBreak,
    smallBlind: level.smallBlind,
    bigBlind: level.bigBlind,
    ante: level.ante,
    durationSec: level.durationSec,
  };
}

/**
 * Разворачивает часы на текущий момент: если время уровня уже вышло,
 * уровни прокручиваются вперёд без записи в БД, поэтому табло остаётся
 * верным, даже когда админ ничего не нажимает.
 */
export function computeClock(
  tournament: ClockFields,
  rawLevels: BlindLevel[],
  now: Date = new Date(),
): TournamentClockDto {
  const levels = [...rawLevels].sort((a, b) => a.idx - b.idx);
  const serverTime = now.toISOString();
  const playersIn = tournament.livePlayersIn ?? null;

  const empty: TournamentClockDto = {
    status: tournament.clockStatus,
    isRunning: false,
    current: null,
    next: null,
    secondsLeft: null,
    secondsToBreak: null,
    levelEndsAt: null,
    breakAt: null,
    playersIn,
    levelsTotal: levels.length,
    serverTime,
  };

  if (levels.length === 0) {
    return empty;
  }

  const startIdx = Math.max(0, Math.min(tournament.clockLevelIdx, levels.length - 1));

  if (tournament.clockStatus === 'IDLE' || !tournament.clockStartedAt) {
    return {
      ...empty,
      current: toDto(levels[startIdx], levels),
      next: levels[startIdx + 1] ? toDto(levels[startIdx + 1], levels) : null,
      secondsLeft: levels[startIdx].durationSec,
    };
  }

  if (tournament.clockStatus === 'FINISHED') {
    return { ...empty, status: 'FINISHED' };
  }

  // На паузе время замирает в момент clockPausedAt.
  const reference =
    tournament.clockStatus === 'PAUSED' && tournament.clockPausedAt
      ? tournament.clockPausedAt
      : now;

  let idx = startIdx;
  let levelStartedMs = tournament.clockStartedAt.getTime();
  let elapsed = Math.max(0, reference.getTime() - levelStartedMs);

  while (idx < levels.length && elapsed >= levels[idx].durationSec * 1000) {
    elapsed -= levels[idx].durationSec * 1000;
    levelStartedMs += levels[idx].durationSec * 1000;
    idx += 1;
  }

  if (idx >= levels.length) {
    return {
      ...empty,
      status: 'FINISHED',
      current: toDto(levels[levels.length - 1], levels),
    };
  }

  const current = levels[idx];
  const levelEndsMs = levelStartedMs + current.durationSec * 1000;
  const secondsLeft = Math.max(0, Math.ceil((levelEndsMs - reference.getTime()) / 1000));

  // Ближайший перерыв: суммируем длительности уровней до него.
  let breakAtMs: number | null = null;
  if (current.isBreak) {
    breakAtMs = reference.getTime();
  } else {
    let cursor = levelEndsMs;
    for (let i = idx + 1; i < levels.length; i += 1) {
      if (levels[i].isBreak) {
        breakAtMs = cursor;
        break;
      }
      cursor += levels[i].durationSec * 1000;
    }
  }

  return {
    status: tournament.clockStatus,
    isRunning: tournament.clockStatus === 'RUNNING',
    current: toDto(current, levels),
    next: levels[idx + 1] ? toDto(levels[idx + 1], levels) : null,
    secondsLeft,
    secondsToBreak:
      breakAtMs == null ? null : Math.max(0, Math.ceil((breakAtMs - reference.getTime()) / 1000)),
    levelEndsAt: new Date(levelEndsMs).toISOString(),
    breakAt: breakAtMs == null ? null : new Date(breakAtMs).toISOString(),
    playersIn,
    levelsTotal: levels.length,
    serverTime,
  };
}

/** Структура по умолчанию: 20-минутные уровни и перерыв каждый четвёртый. */
export function defaultBlindStructure(): Array<{
  idx: number;
  isBreak: boolean;
  smallBlind: number | null;
  bigBlind: number | null;
  ante: number | null;
  durationSec: number;
}> {
  const blinds: Array<[number, number, number | null]> = [
    [25, 50, null],
    [50, 100, null],
    [75, 150, null],
    [100, 200, 200],
    [150, 300, 300],
    [200, 400, 400],
    [300, 600, 600],
    [400, 800, 800],
    [500, 1000, 1000],
    [700, 1400, 1400],
    [1000, 2000, 2000],
    [1500, 3000, 3000],
  ];

  const levels: ReturnType<typeof defaultBlindStructure> = [];
  let idx = 0;

  blinds.forEach(([smallBlind, bigBlind, ante], position) => {
    levels.push({
      idx: idx++,
      isBreak: false,
      smallBlind,
      bigBlind,
      ante,
      durationSec: 20 * 60,
    });

    const isFourth = (position + 1) % 4 === 0;
    if (isFourth && position + 1 < blinds.length) {
      levels.push({
        idx: idx++,
        isBreak: true,
        smallBlind: null,
        bigBlind: null,
        ante: null,
        durationSec: 10 * 60,
      });
    }
  });

  return levels;
}
