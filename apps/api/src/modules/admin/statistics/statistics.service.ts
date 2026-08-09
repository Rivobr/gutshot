import { Injectable } from '@nestjs/common';
import { PlayerEventType, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

function displayPlayerName(user: {
  nickname?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  telegramId?: string | null;
}): string {
  if (user.nickname?.trim()) {
    return user.nickname.trim();
  }
  const fromName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fromName) {
    return fromName;
  }
  if (user.username?.trim()) {
    return `@${user.username.trim()}`;
  }
  if (user.telegramId?.trim()) {
    return `Игрок ${user.telegramId}`;
  }
  return 'Игрок';
}

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics() {
    const [
      playersCount,
      tournamentsCount,
      visits,
      wins,
      totalRebuys,
      recentRebuyEvents,
      topPlayers,
      topTournaments,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.tournament.count(),
      this.prisma.registration.count({ where: { status: RegistrationStatus.FINISHED } }),
      this.prisma.tournamentResult.count({ where: { place: 1 } }),
      this.prisma.playerEvent.count({ where: { type: PlayerEventType.RE_ENTRY } }),
      this.prisma.playerEvent.findMany({
        where: { type: PlayerEventType.RE_ENTRY },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: {
            select: {
              id: true,
              telegramId: true,
              username: true,
              firstName: true,
              lastName: true,
              nickname: true,
            },
          },
          tournament: { select: { id: true, title: true } },
        },
      }),
      this.prisma.playerProfile.findMany({
        orderBy: { xp: 'desc' },
        take: 10,
        include: { user: true },
      }),
      this.prisma.tournament.findMany({
        orderBy: { registrations: { _count: 'desc' } },
        take: 10,
        include: { _count: { select: { registrations: true } } },
      }),
    ]);

    const tournamentsWithVisits = await this.prisma.tournament.count({
      where: { registrations: { some: { status: RegistrationStatus.FINISHED } } },
    });

    return {
      playersCount,
      tournamentsCount,
      totalVisits: visits,
      totalWins: wins,
      averageAttendance: tournamentsWithVisits > 0 ? visits / tournamentsWithVisits : 0,
      totalRebuys,
      recentRebuys: recentRebuyEvents.map((event) => ({
        id: event.id,
        createdAt: event.createdAt,
        userId: event.user.id,
        playerName: displayPlayerName(event.user),
        username: event.user.username,
        telegramId: event.user.telegramId,
        tournamentId: event.tournament?.id ?? null,
        tournamentTitle: event.tournament?.title ?? null,
      })),
      topPlayers: topPlayers.map((profile) => ({
        userId: profile.userId,
        name: displayPlayerName(profile.user),
        xp: profile.xp,
      })),
      topTournaments: topTournaments.map((tournament) => ({
        id: tournament.id,
        title: tournament.title,
        registrations: tournament._count.registrations,
      })),
    };
  }
}
