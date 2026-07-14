import { Injectable } from '@nestjs/common';
import { RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics() {
    const [playersCount, tournamentsCount, visits, wins, topPlayers, topTournaments] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.tournament.count(),
      this.prisma.registration.count({ where: { status: RegistrationStatus.FINISHED } }),
      this.prisma.tournamentResult.count({ where: { place: 1 } }),
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
      topPlayers: topPlayers.map((profile) => ({
        userId: profile.userId,
        name: `${profile.user.firstName ?? ''} ${profile.user.lastName ?? ''}`.trim(),
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
