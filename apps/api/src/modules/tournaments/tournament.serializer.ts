import type { BlindLevel, Tournament as PrismaTournament } from '@prisma/client';
import { computeClock, type TournamentClockDto } from './tournament-clock';

type TournamentWithCount = PrismaTournament & {
  _count?: { registrations: number };
  blindLevels?: BlindLevel[];
};

export interface TournamentLiveDto {
  isRunning: boolean;
  level?: number | null;
  smallBlind?: number | null;
  bigBlind?: number | null;
  ante?: number | null;
  nextBreakInSec?: number | null;
  playersIn?: number | null;
  updatedAt?: string | null;
  /** Момент смены уровня — клиент тикает локально, без опроса каждую секунду. */
  levelEndsAt?: string | null;
  levelSecondsLeft?: number | null;
  isBreak?: boolean;
  serverTime?: string | null;
}

/**
 * Live-состояние: если задана структура блайндов, источник истины — часы,
 * иначе остаётся ручной режим (админ выставляет блайнды сам).
 */
export function mapTournamentLive(
  tournament: PrismaTournament,
  blindLevels: BlindLevel[] = [],
): TournamentLiveDto | null {
  if (blindLevels.length > 0 && tournament.clockStatus !== 'IDLE') {
    const clock = computeClock(tournament, blindLevels);
    const current = clock.current;

    return {
      isRunning: clock.isRunning,
      level: current?.number ?? null,
      smallBlind: current?.smallBlind ?? null,
      bigBlind: current?.bigBlind ?? null,
      ante: current?.ante ?? null,
      nextBreakInSec: clock.secondsToBreak,
      playersIn: clock.playersIn,
      updatedAt: tournament.liveUpdatedAt?.toISOString() ?? null,
      levelEndsAt: clock.levelEndsAt,
      levelSecondsLeft: clock.secondsLeft,
      isBreak: current?.isBreak ?? false,
      serverTime: clock.serverTime,
    };
  }

  if (
    !tournament.liveIsRunning &&
    tournament.liveLevel == null &&
    tournament.liveSmallBlind == null &&
    tournament.liveBigBlind == null &&
    tournament.livePlayersIn == null &&
    tournament.liveNextBreakInSec == null
  ) {
    return null;
  }

  return {
    isRunning: tournament.liveIsRunning,
    level: tournament.liveLevel,
    smallBlind: tournament.liveSmallBlind,
    bigBlind: tournament.liveBigBlind,
    ante: tournament.liveAnte,
    nextBreakInSec: tournament.liveNextBreakInSec,
    playersIn: tournament.livePlayersIn,
    updatedAt: tournament.liveUpdatedAt?.toISOString() ?? null,
    isBreak: false,
    serverTime: new Date().toISOString(),
  };
}

export function serializeTournament(tournament: TournamentWithCount) {
  const {
    liveIsRunning: _a,
    liveLevel: _b,
    liveSmallBlind: _c,
    liveBigBlind: _d,
    liveAnte: _e,
    liveNextBreakInSec: _f,
    livePlayersIn: _g,
    liveUpdatedAt: _h,
    clockStatus: _i,
    clockStartedAt: _j,
    clockLevelIdx: _k,
    clockPausedAt: _l,
    blindLevels,
    ...rest
  } = tournament;

  return {
    ...rest,
    date: tournament.date.toISOString(),
    registrationOpen: tournament.registrationOpen?.toISOString() ?? null,
    registrationClose: tournament.registrationClose?.toISOString() ?? null,
    reminderSentAt: tournament.reminderSentAt?.toISOString() ?? null,
    createdAt: tournament.createdAt.toISOString(),
    updatedAt: tournament.updatedAt.toISOString(),
    live: mapTournamentLive(tournament, blindLevels ?? []),
  };
}

/** Полное состояние часов — для админки и TV-табло. */
export function serializeClock(
  tournament: PrismaTournament,
  blindLevels: BlindLevel[],
): TournamentClockDto {
  return computeClock(tournament, blindLevels);
}
