import { Injectable } from '@nestjs/common';
import { RegistrationStatus, TournamentStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const ACTIVE_REG_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.REGISTERED,
  RegistrationStatus.CHECKED_IN,
  RegistrationStatus.PLAYING,
  RegistrationStatus.WAITING,
  RegistrationStatus.FINISHED,
];

const HOME_STATUSES: TournamentStatus[] = [
  TournamentStatus.REGISTRATION_OPEN,
  TournamentStatus.REGISTRATION_CLOSED,
  TournamentStatus.IN_PROGRESS,
];

function moscowDayBounds(now = new Date()): { start: Date; end: Date } {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const start = new Date(`${day}T00:00:00+03:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const tournamentInclude = {
      _count: {
        select: {
          registrations: {
            where: { status: { in: ACTIVE_REG_STATUSES } },
          },
        },
      },
    } as const;

    const [
      playersCount,
      activeTournaments,
      nearestTournament,
      registrationsCount,
      recentRegistrations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.tournament.count({
        where: {
          status: { in: [TournamentStatus.REGISTRATION_OPEN, TournamentStatus.IN_PROGRESS] },
        },
      }),
      this.findHomeTournament(tournamentInclude),
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

  /** Тот же приоритет, что у Mini App /tournaments/nearest. */
  private async findHomeTournament(include: {
    _count: {
      select: {
        registrations: {
          where: { status: { in: RegistrationStatus[] } };
        };
      };
    };
  }) {
    const inProgress = await this.prisma.tournament.findFirst({
      where: { status: TournamentStatus.IN_PROGRESS },
      orderBy: { date: 'desc' },
      include,
    });
    if (inProgress) return inProgress;

    const { start, end } = moscowDayBounds();
    const today = await this.prisma.tournament.findFirst({
      where: {
        status: { in: HOME_STATUSES },
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'desc' },
      include,
    });
    if (today) return today;

    return this.prisma.tournament.findFirst({
      where: {
        date: { gte: new Date() },
        status: { in: HOME_STATUSES },
      },
      orderBy: { date: 'asc' },
      include,
    });
  }
}
