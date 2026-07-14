import { Injectable } from '@nestjs/common';
import { RegistrationStatus, TournamentStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [playersCount, activeTournaments, nearestTournament, registrationsCount, recentRegistrations] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.tournament.count({
          where: { status: { in: [TournamentStatus.REGISTRATION_OPEN, TournamentStatus.IN_PROGRESS] } },
        }),
        this.prisma.tournament.findFirst({
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
          include: { _count: { select: { registrations: true } } },
        }),
        this.prisma.registration.count({
          where: { status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITING] } },
        }),
        this.prisma.registration.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: true, tournament: true },
        }),
      ]);

    const freeSlots = nearestTournament
      ? nearestTournament.maxPlayers - nearestTournament._count.registrations
      : 0;

    return {
      playersCount,
      activeTournaments,
      nearestTournament,
      registrationsCount,
      freeSlots,
      recentRegistrations,
    };
  }
}
