import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  PlayerEventType,
  Registration,
  RegistrationStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { NotificationsService } from '../telegram/notifications.service';
import { PlayerEventsService } from '../progression/player-events.service';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
    private readonly notificationsService: NotificationsService,
    private readonly playerEventsService: PlayerEventsService,
  ) {}

  private static readonly ACTIVE_REGISTRATION_STATUSES: RegistrationStatus[] = [
    RegistrationStatus.REGISTERED,
    RegistrationStatus.WAITING,
    RegistrationStatus.CHECKED_IN,
    RegistrationStatus.PLAYING,
  ];

  /**
   * Регистрация без ограничений по статусу турнира, вместимости и «один турнир на игрока».
   * Остаются только: авторизация, блок игрока, существование турнира, дубликат записи.
   */
  async register(userId: string, tournamentId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.isBlocked) {
      throw new BadRequestException('Игрок заблокирован');
    }

    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    const existing = await this.prisma.registration.findUnique({
      where: { userId_tournamentId: { userId, tournamentId } },
    });

    if (existing && existing.status !== RegistrationStatus.CANCELLED) {
      throw new ConflictException('Игрок уже зарегистрирован на этот турнир');
    }

    const status = RegistrationStatus.REGISTERED;

    const registration = await this.prisma.registration.upsert({
      where: { userId_tournamentId: { userId, tournamentId } },
      update: { status, cancelledAt: null, registeredAt: new Date() },
      create: { userId, tournamentId, status },
    });

    await this.playerEventsService.record({
      userId,
      type: PlayerEventType.TOURNAMENT_REGISTRATION,
      tournamentId,
      metadata: {
        status,
        title: tournament.title,
      },
    });

    await this.notificationsService.notify({
      userId: user.id,
      telegramId: user.telegramId,
      type: NotificationType.REGISTRATION,
      title: 'Регистрация подтверждена',
      message: this.telegramService.templates.registrationSuccess(tournament.title),
    });

    return registration;
  }

  /** Отмена записи + перевод следующего из листа ожидания. */
  private async cancelRegistrationAndPromote(registrationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
      });

      if (!registration) {
        return null;
      }

      const wasActiveSlot = registration.status === RegistrationStatus.REGISTERED;

      await tx.registration.update({
        where: { id: registrationId },
        data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
      });

      if (!wasActiveSlot) {
        return null;
      }

      const nextWaiting = await tx.registration.findFirst({
        where: {
          tournamentId: registration.tournamentId,
          status: RegistrationStatus.WAITING,
        },
        orderBy: { registeredAt: 'asc' },
        include: { user: true },
      });

      if (!nextWaiting) {
        return null;
      }

      await tx.registration.update({
        where: { id: nextWaiting.id },
        data: { status: RegistrationStatus.REGISTERED },
      });

      return nextWaiting;
    });
  }

  async cancel(userId: string, registrationId: string): Promise<void> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { tournament: true, user: true },
    });

    if (!registration || registration.userId !== userId) {
      throw new NotFoundException('Регистрация не найдена');
    }

    const nonCancellable: RegistrationStatus[] = [
      RegistrationStatus.FINISHED,
      RegistrationStatus.CANCELLED,
    ];

    if (nonCancellable.includes(registration.status)) {
      throw new BadRequestException('Регистрацию невозможно отменить');
    }

    const promoted = await this.cancelRegistrationAndPromote(registrationId);

    if (promoted) {
      await this.notificationsService.notify({
        userId: promoted.userId,
        telegramId: promoted.user.telegramId,
        type: NotificationType.REGISTRATION,
        title: 'Вы в основном списке',
        message: this.telegramService.templates.movedFromWaiting(registration.tournament.title),
      });
    }

    await this.playerEventsService.record({
      userId: registration.userId,
      type: PlayerEventType.TOURNAMENT_CANCELLED,
      tournamentId: registration.tournamentId,
      metadata: { title: registration.tournament.title },
    });

    await this.notificationsService.notify({
      userId: registration.userId,
      telegramId: registration.user.telegramId,
      type: NotificationType.REGISTRATION,
      title: 'Регистрация отменена',
      message: this.telegramService.templates.registrationCancelled(registration.tournament.title),
    });
  }

  /** Все активные регистрации игрока (можно быть записанным на несколько турниров). */
  async getCurrent(userId: string): Promise<Registration[]> {
    return this.prisma.registration.findMany({
      where: {
        userId,
        status: {
          in: RegistrationsService.ACTIVE_REGISTRATION_STATUSES,
        },
      },
      orderBy: { registeredAt: 'desc' },
      include: { tournament: true },
    });
  }

  async findByTournament(tournamentId: string) {
    return this.prisma.registration.findMany({
      where: { tournamentId },
      include: { user: true },
      orderBy: { registeredAt: 'asc' },
    });
  }
}
