import { Injectable, NotFoundException } from '@nestjs/common';
import { RegistrationStatus, Tournament, TournamentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateLevel } from '../../common/utils/level.util';
import { buildShowcaseAchievements } from '../../common/utils/showcase-achievements.util';
import { serializeTournament } from './tournament.serializer';

/** Активные регистрации — отменённые места не занимают. */
const ACTIVE_REGISTRATION_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.REGISTERED,
  RegistrationStatus.CHECKED_IN,
  RegistrationStatus.PLAYING,
  RegistrationStatus.FINISHED,
  RegistrationStatus.WAITING,
];

const activeRegistrationsCount = {
  select: {
    registrations: {
      where: { status: { in: ACTIVE_REGISTRATION_STATUSES } },
    },
  },
} as const;

const HOME_TOURNAMENT_STATUSES: TournamentStatus[] = [
  TournamentStatus.REGISTRATION_OPEN,
  TournamentStatus.REGISTRATION_CLOSED,
  TournamentStatus.IN_PROGRESS,
];

/** Границы календарного дня Europe/Moscow в UTC. */
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
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getParticipants(id: string) {
    await this.findById(id);

    const registrations = await this.prisma.registration.findMany({
      where: {
        tournamentId: id,
        status: { in: ACTIVE_REGISTRATION_STATUSES },
      },
      orderBy: { registeredAt: 'asc' },
      include: {
        user: {
          include: {
            playerProfile: true,
            tournamentResults: { select: { place: true } },
          },
        },
      },
    });

    const userIds = registrations.map((reg) => reg.user.id);
    const unlocked = userIds.length
      ? await this.prisma.playerAchievement.findMany({
          where: { userId: { in: userIds } },
          select: { userId: true, achievementId: true },
        })
      : [];
    const unlockedByUser = new Map<string, string[]>();
    for (const row of unlocked) {
      const list = unlockedByUser.get(row.userId);
      if (list) {
        list.push(row.achievementId);
      } else {
        unlockedByUser.set(row.userId, [row.achievementId]);
      }
    }

    return registrations.map((reg) => {
      const results = reg.user.tournamentResults;
      const itm = results.filter((r) => r.place <= 10).length;
      const top10Percent = results.length > 0 ? Math.round((itm / results.length) * 100) : 0;
      const showcaseAchievements = buildShowcaseAchievements(
        reg.user.pinnedAchievements,
        unlockedByUser.get(reg.user.id) ?? [],
      );

      return {
        userId: reg.user.id,
        firstName: reg.user.firstName,
        lastName: reg.user.lastName,
        nickname: reg.user.nickname,
        username: reg.user.username,
        photoUrl: reg.user.photoUrl,
        level: calculateLevel(reg.user.playerProfile?.xp ?? 0),
        pinnedAchievements: reg.user.pinnedAchievements,
        showcaseAchievements,
        top10Percent,
        status: reg.status,
      };
    });
  }

  async findAll(filters: { status?: TournamentStatus; date?: string }) {
    const rows = await this.prisma.tournament.findMany({
      where: {
        status: filters.status,
        date: filters.date
          ? {
              gte: new Date(new Date(filters.date).setHours(0, 0, 0, 0)),
              lt: new Date(new Date(filters.date).setHours(24, 0, 0, 0)),
            }
          : undefined,
      },
      orderBy: { date: 'asc' },
      include: { blindLevels: true, _count: activeRegistrationsCount },
    });
    return rows.map(serializeTournament);
  }

  async findById(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { blindLevels: true, _count: activeRegistrationsCount },
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    return serializeTournament(tournament);
  }

  /**
   * Турнир для главной:
   * 1) идущий сейчас;
   * 2) самый свежий на сегодня (MSK), даже если время старта уже прошло;
   * 3) иначе ближайший будущий.
   */
  async findNearest() {
    const include = { blindLevels: true, _count: activeRegistrationsCount } as const;

    const inProgress = await this.prisma.tournament.findFirst({
      where: { status: TournamentStatus.IN_PROGRESS },
      orderBy: { date: 'desc' },
      include,
    });
    if (inProgress) {
      return serializeTournament(inProgress);
    }

    const { start, end } = moscowDayBounds();
    const today = await this.prisma.tournament.findFirst({
      where: {
        status: { in: HOME_TOURNAMENT_STATUSES },
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'desc' },
      include,
    });
    if (today) {
      return serializeTournament(today);
    }

    const upcoming = await this.prisma.tournament.findFirst({
      where: {
        date: { gte: new Date() },
        status: { in: HOME_TOURNAMENT_STATUSES },
      },
      orderBy: { date: 'asc' },
      include,
    });
    return upcoming ? serializeTournament(upcoming) : null;
  }

  async create(data: {
    title: string;
    description?: string;
    date: Date;
    buyIn: number;
    maxPlayers: number;
    registrationOpen?: Date;
    registrationClose?: Date;
  }): Promise<Tournament> {
    return this.prisma.tournament.create({ data });
  }

  async update(id: string, data: Partial<Tournament>): Promise<Tournament> {
    await this.findById(id);
    return this.prisma.tournament.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.tournament.delete({ where: { id } });
  }

  async openRegistration(id: string): Promise<Tournament> {
    await this.findById(id);
    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.REGISTRATION_OPEN },
    });
  }

  async closeRegistration(id: string): Promise<Tournament> {
    await this.findById(id);
    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.REGISTRATION_CLOSED },
    });
  }
}
