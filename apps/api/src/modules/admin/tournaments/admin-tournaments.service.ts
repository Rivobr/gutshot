import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationType,
  PlayerEventType,
  RegistrationStatus,
  TournamentStatus,
  XPReason,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TelegramService } from '../../telegram/telegram.service';
import { NotificationsService } from '../../telegram/notifications.service';
import { getXpForPlace } from '../../../common/constants/xp.constants';
import { xpSettingKeyForPlace } from '../../../common/constants/xp-defaults.constants';
import { XpService } from '../../progression/xp.service';
import { XpSettingsService } from '../../progression/xp-settings.service';
import { LevelsService } from '../../progression/levels.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentResultEntryDto } from './dto/finish-tournament.dto';

@Injectable()
export class AdminTournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
    private readonly notificationsService: NotificationsService,
    private readonly xpService: XpService,
    private readonly xpSettingsService: XpSettingsService,
    private readonly levelsService: LevelsService,
  ) {}

  async findAll() {
    return this.prisma.tournament.findMany({
      orderBy: { date: 'desc' },
      include: { _count: { select: { registrations: true } } },
    });
  }

  async findById(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    return tournament;
  }

  async create(dto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: {
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        buyIn: dto.buyIn,
        maxPlayers: dto.maxPlayers,
        registrationOpen: dto.registrationOpen ? new Date(dto.registrationOpen) : undefined,
        registrationClose: dto.registrationClose ? new Date(dto.registrationClose) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateTournamentDto) {
    await this.findById(id);
    return this.prisma.tournament.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
        registrationOpen: dto.registrationOpen ? new Date(dto.registrationOpen) : undefined,
        registrationClose: dto.registrationClose ? new Date(dto.registrationClose) : undefined,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.tournament.delete({ where: { id } });
  }

  async openRegistration(id: string) {
    await this.findById(id);
    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.REGISTRATION_OPEN },
    });
  }

  async closeRegistration(id: string) {
    await this.findById(id);
    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.REGISTRATION_CLOSED },
    });
  }

  async start(id: string) {
    const tournament = await this.findById(id);

    if (tournament.status === TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Турнир уже начат');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.registration.updateMany({
        where: { tournamentId: id, status: RegistrationStatus.CHECKED_IN },
        data: { status: RegistrationStatus.PLAYING },
      });

      return tx.tournament.update({
        where: { id },
        data: { status: TournamentStatus.IN_PROGRESS },
      });
    });
  }

  /** Список зарегистрированных игроков с уровнем, XP и статусом явки. */
  async getRegistrations(tournamentId: string) {
    await this.findById(tournamentId);

    const [registrations, thresholds] = await Promise.all([
      this.prisma.registration.findMany({
        where: { tournamentId },
        include: { user: { include: { playerProfile: true } } },
        orderBy: { registeredAt: 'asc' },
      }),
      this.levelsService.getThresholds(),
    ]);

    return registrations.map((registration) => {
      const xp = registration.user.playerProfile?.xp ?? 0;

      return {
        id: registration.id,
        status: registration.status,
        registeredAt: registration.registeredAt,
        arrivedAt: registration.arrivedAt,
        attendanceXpGiven: registration.attendanceXpGiven,
        reEntries: registration.reEntries,
        bounties: registration.bounties,
        user: {
          id: registration.user.id,
          telegramId: registration.user.telegramId,
          username: registration.user.username,
          firstName: registration.user.firstName,
          lastName: registration.user.lastName,
          photoUrl: registration.user.photoUrl,
          xp,
          level: this.levelsService.computeProgress(thresholds, xp).level,
        },
      };
    });
  }

  async finish(id: string, results: TournamentResultEntryDto[], adminId: string) {
    const tournament = await this.findById(id);

    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Турнир не находится в процессе игры');
    }

    const xpSettings = await this.xpSettingsService.getAll();

    const finishedPlayers = await this.prisma.$transaction(async (tx) => {
      const processed: {
        userId: string;
        telegramId: string;
        title: string;
        place: number;
        xp: number;
        newLevel: number;
      }[] = [];

      for (const entry of results) {
        const registration = await tx.registration.findUnique({
          where: { id: entry.registrationId },
          include: { user: true },
        });

        if (!registration || registration.tournamentId !== id) {
          throw new BadRequestException(`Регистрация ${entry.registrationId} не найдена в этом турнире`);
        }

        // Места 1–10 берутся из настраиваемой таблицы XP,
        // для остальных сохраняется историческое значение.
        const settingKey = xpSettingKeyForPlace(entry.place);
        const xpEarned = settingKey ? xpSettings[settingKey] : getXpForPlace(entry.place);

        const result = await tx.tournamentResult.upsert({
          where: { userId_tournamentId: { userId: registration.userId, tournamentId: id } },
          update: { place: entry.place, xpEarned },
          create: {
            userId: registration.userId,
            tournamentId: id,
            place: entry.place,
            xpEarned,
          },
        });

        await tx.registration.update({
          where: { id: registration.id },
          data: { status: RegistrationStatus.FINISHED },
        });

        const award = await this.xpService.award(tx, {
          userId: registration.userId,
          amount: xpEarned,
          reason: entry.place === 1 ? XPReason.TOURNAMENT_WIN : XPReason.TOURNAMENT_PLACE,
          eventType: PlayerEventType.TOURNAMENT_RESULT,
          tournamentId: id,
          tournamentResultId: result.id,
          performedById: adminId,
          metadata: { place: entry.place, title: tournament.title },
        });

        processed.push({
          userId: registration.userId,
          telegramId: registration.user.telegramId,
          title: tournament.title,
          place: entry.place,
          xp: xpEarned,
          newLevel: award.level,
        });
      }

      await tx.tournament.update({ where: { id }, data: { status: TournamentStatus.FINISHED } });

      return processed;
    });

    for (const player of finishedPlayers) {
      await this.notificationsService.notify({
        userId: player.userId,
        telegramId: player.telegramId,
        type: NotificationType.TOURNAMENT_RESULT,
        title: 'Результаты турнира',
        message: this.telegramService.templates.tournamentFinished(
          player.title,
          player.place,
          player.xp,
        ),
      });
    }

    return this.findById(id);
  }
}
