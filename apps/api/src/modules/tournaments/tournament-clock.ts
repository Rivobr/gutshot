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

export type BlindStructureLevel = {
  idx: number;
  isBreak: boolean;
  smallBlind: number | null;
  bigBlind: number | null;
  ante: number | null;
  durationSec: number;
};

export type BlindStructureTemplateId = 'classic20' | 'club';

function buildLevels(
  rows: Array<
    | { isBreak: true; minutes: number }
    | {
        isBreak?: false;
        smallBlind: number;
        bigBlind: number;
        ante: number | null;
        minutes: number;
      }
  >,
): BlindStructureLevel[] {
  return rows.map((row, idx) => {
    if (row.isBreak) {
      return {
        idx,
        isBreak: true,
        smallBlind: null,
        bigBlind: null,
        ante: null,
        durationSec: row.minutes * 60,
      };
    }

    return {
      idx,
      isBreak: false,
      smallBlind: row.smallBlind,
      bigBlind: row.bigBlind,
      ante: row.ante,
      durationSec: row.minutes * 60,
    };
  });
}

/** Структура по умолчанию: 20-минутные уровни и перерыв каждый четвёртый. */
export function defaultBlindStructure(): BlindStructureLevel[] {
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

  const levels: BlindStructureLevel[] = [];
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

/**
 * Клубный шаблон с офлайн-теликов (BB-ante).
 * До late reg — как на TV. После 15-мин перерыва — плавный рост (~×1.25),
 * короткие часы и 5-мин перерыв примерно через час (после 8k/16k).
 */
export function clubBlindStructure(): BlindStructureLevel[] {
  return buildLevels([
    { smallBlind: 100, bigBlind: 100, ante: 100, minutes: 12 },
    { smallBlind: 100, bigBlind: 200, ante: 200, minutes: 12 },
    { smallBlind: 200, bigBlind: 400, ante: 400, minutes: 15 },
    { smallBlind: 300, bigBlind: 600, ante: 600, minutes: 20 },
    { isBreak: true, minutes: 10 },
    { smallBlind: 400, bigBlind: 800, ante: 800, minutes: 25 },
    { smallBlind: 500, bigBlind: 1000, ante: 1000, minutes: 30 },
    { smallBlind: 600, bigBlind: 1200, ante: 1200, minutes: 20 },
    { isBreak: true, minutes: 10 },
    { smallBlind: 800, bigBlind: 1600, ante: 1600, minutes: 23 },
    { smallBlind: 1000, bigBlind: 2000, ante: 2000, minutes: 23 },
    { smallBlind: 1500, bigBlind: 3000, ante: 3000, minutes: 20 },
    { isBreak: true, minutes: 15 },
    { smallBlind: 2000, bigBlind: 4000, ante: 4000, minutes: 12 },
    { smallBlind: 2500, bigBlind: 5000, ante: 5000, minutes: 8 },
    { smallBlind: 3000, bigBlind: 6000, ante: 6000, minutes: 8 },
    { smallBlind: 4000, bigBlind: 8000, ante: 8000, minutes: 8 },
    { smallBlind: 5000, bigBlind: 10000, ante: 10000, minutes: 8 },
    { smallBlind: 6000, bigBlind: 12000, ante: 12000, minutes: 8 },
    { smallBlind: 8000, bigBlind: 16000, ante: 16000, minutes: 6 },
    { isBreak: true, minutes: 5 },
    { smallBlind: 10000, bigBlind: 20000, ante: 20000, minutes: 6 },
    { smallBlind: 12500, bigBlind: 25000, ante: 25000, minutes: 6 },
    { smallBlind: 15000, bigBlind: 30000, ante: 30000, minutes: 6 },
    { smallBlind: 20000, bigBlind: 40000, ante: 40000, minutes: 6 },
    { smallBlind: 25000, bigBlind: 50000, ante: 50000, minutes: 6 },
    { smallBlind: 30000, bigBlind: 60000, ante: 60000, minutes: 6 },
    { smallBlind: 40000, bigBlind: 80000, ante: 80000, minutes: 6 },
    { smallBlind: 50000, bigBlind: 100000, ante: 100000, minutes: 6 },
    { smallBlind: 75000, bigBlind: 150000, ante: 150000, minutes: 6 },
    { smallBlind: 100000, bigBlind: 200000, ante: 200000, minutes: 6 },
    { smallBlind: 150000, bigBlind: 300000, ante: 300000, minutes: 6 },
    { smallBlind: 200000, bigBlind: 400000, ante: 400000, minutes: 6 },
  ]);
}

/** Выбирает именованный шаблон структуры. */
export function resolveBlindStructureTemplate(
  template: BlindStructureTemplateId | string | null | undefined = 'classic20',
): BlindStructureLevel[] {
  if (template === 'club') return clubBlindStructure();
  return defaultBlindStructure();
}
