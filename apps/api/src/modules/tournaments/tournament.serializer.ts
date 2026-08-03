import type { Tournament as PrismaTournament } from '@prisma/client';

type TournamentWithCount = PrismaTournament & {
  _count?: { registrations: number };
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
}

export function mapTournamentLive(tournament: PrismaTournament): TournamentLiveDto | null {
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
    live: mapTournamentLive(tournament),
  };
}
