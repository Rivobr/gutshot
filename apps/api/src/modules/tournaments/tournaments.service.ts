import { Injectable, NotFoundException } from '@nestjs/common';
import { RegistrationStatus, Tournament, TournamentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateLevel } from '../../common/utils/level.util';
import { serializeClock, serializeTournament } from './tournament.serializer';

/** Статусы турнира, при которых он имеет смысл на табло. */
const BOARD_STATUSES = [
  TournamentStatus.IN_PROGRESS,
  TournamentStatus.REGISTRATION_OPEN,
  TournamentStatus.REGISTRATION_CLOSED,
];

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Афиша для публичного сайта: без регистраций и личных данных. */
  async findPublicSchedule() {
    const rows = await this.prisma.tournament.findMany({
      where: { status: { in: BOARD_STATUSES } },
      orderBy: { date: 'asc' },
      take: 20,
      include: { _count: { select: { registrations: true } } },
    });

    return rows.map((row) => {
      const item = serializeTournament(row);
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        date: item.date,
        buyIn: item.buyIn,
        maxPlayers: item.maxPlayers,
        status: item.status,
        imageUrl: item.imageUrl,
        registered: row._count?.registrations ?? 0,
      };
    });
  }

  /** Табло: идущий турнир, иначе ближайший к старту. */
  async findBoard() {
    const running = await this.prisma.tournament.findFirst({
      where: { status: TournamentStatus.IN_PROGRESS },
      orderBy: { date: 'asc' },
      include: { blindLevels: true, _count: { select: { registrations: true } } },
    });

    const tournament =
      running ??
      (await this.prisma.tournament.findFirst({
        where: {
          status: { in: BOARD_STATUSES },
          date: { gte: new Date(Date.now() - 6 * 3600_000) },
        },
        orderBy: { date: 'asc' },
        include: { blindLevels: true, _count: { select: { registrations: true } } },
      }));

    return tournament ? this.toBoardPayload(tournament) : null;
  }

  async findBoardById(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { blindLevels: true, _count: { select: { registrations: true } } },
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    return this.toBoardPayload(tournament);
  }

  private async toBoardPayload(
    tournament: Parameters<typeof serializeTournament>[0] & {
      blindLevels?: Parameters<typeof serializeClock>[1];
    },
  ) {
    const levels = tournament.blindLevels ?? [];
    const playing = await this.prisma.registration.count({
      where: {
        tournamentId: tournament.id,
        status: { in: [RegistrationStatus.PLAYING, RegistrationStatus.CHECKED_IN] },
      },
    });

    const clock = serializeClock(tournament, levels);

    return {
      tournament: {
        id: tournament.id,
        title: tournament.title,
        date: tournament.date.toISOString(),
        buyIn: tournament.buyIn,
        maxPlayers: tournament.maxPlayers,
        status: tournament.status,
        imageUrl: tournament.imageUrl,
        registered: tournament._count?.registrations ?? 0,
      },
      clock: {
        ...clock,
        // Явку считаем по регистрациям, ручное значение — только как запасное.
        playersIn: clock.playersIn ?? (playing > 0 ? playing : null),
      },
      levels: levels
        .slice()
        .sort((a, b) => a.idx - b.idx)
        .map((level) => ({
          idx: level.idx,
          isBreak: level.isBreak,
          smallBlind: level.smallBlind,
          bigBlind: level.bigBlind,
          ante: level.ante,
          durationSec: level.durationSec,
        })),
    };
  }

  async getParticipants(id: string) {
    await this.findById(id);

    const registrations = await this.prisma.registration.findMany({
      where: {
        tournamentId: id,
        status: { in: ['REGISTERED', 'CHECKED_IN', 'PLAYING', 'FINISHED', 'WAITING'] },
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

    return registrations.map((reg) => {
      const results = reg.user.tournamentResults;
      const itm = results.filter((r) => r.place <= 10).length;
      const top10Percent = results.length > 0 ? Math.round((itm / results.length) * 100) : 0;

      return {
        userId: reg.user.id,
        firstName: reg.user.firstName,
        lastName: reg.user.lastName,
        nickname: reg.user.nickname,
        username: reg.user.username,
        photoUrl: reg.user.photoUrl,
        level: calculateLevel(reg.user.playerProfile?.xp ?? 0),
        pinnedAchievements: reg.user.pinnedAchievements,
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
      include: { blindLevels: true, _count: { select: { registrations: true } } },
    });
    return rows.map(serializeTournament);
  }

  async findById(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { blindLevels: true, _count: { select: { registrations: true } } },
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    return serializeTournament(tournament);
  }

  async findNearest() {
    const tournament = await this.prisma.tournament.findFirst({
      where: {
        date: { gte: new Date() },
        status: {
          in: [
            TournamentStatus.REGISTRATION_OPEN,
            TournamentStatus.REGISTRATION_CLOSED,
            TournamentStatus.IN_PROGRESS,
          ],
        },
      },
      orderBy: { date: 'asc' },
      include: { blindLevels: true, _count: { select: { registrations: true } } },
    });
    return tournament ? serializeTournament(tournament) : null;
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
