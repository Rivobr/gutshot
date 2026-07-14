import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, RegistrationStatus, TournamentStatus, XPReason } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TelegramService } from '../../telegram/telegram.service';
import { NotificationsService } from '../../telegram/notifications.service';
import { getXpForPlace } from '../../../common/constants/xp.constants';
import { calculateLevelProgress } from '../../../common/utils/level.util';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentResultEntryDto } from './dto/finish-tournament.dto';

@Injectable()
export class AdminTournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
    private readonly notificationsService: NotificationsService,
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

  async finish(id: string, results: TournamentResultEntryDto[]) {
    const tournament = await this.findById(id);

    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Турнир не находится в процессе игры');
    }

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
          include: { user: { include: { playerProfile: true } } },
        });

        if (!registration || registration.tournamentId !== id) {
          throw new BadRequestException(`Регистрация ${entry.registrationId} не найдена в этом турнире`);
        }

        const xpEarned = getXpForPlace(entry.place);

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

        await tx.xPHistory.create({
          data: {
            userId: registration.userId,
            tournamentResultId: result.id,
            reason: entry.place === 1 ? XPReason.TOURNAMENT_WIN : XPReason.TOURNAMENT_PLACE,
            amount: xpEarned,
          },
        });

        const profile = registration.user.playerProfile;
        const newXp = (profile?.xp ?? 0) + xpEarned;

        if (profile) {
          await tx.playerProfile.update({ where: { userId: registration.userId }, data: { xp: newXp } });
        } else {
          await tx.playerProfile.create({ data: { userId: registration.userId, xp: newXp } });
        }

        const { level } = calculateLevelProgress(newXp);

        processed.push({
          userId: registration.userId,
          telegramId: registration.user.telegramId,
          title: tournament.title,
          place: entry.place,
          xp: xpEarned,
          newLevel: level,
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
