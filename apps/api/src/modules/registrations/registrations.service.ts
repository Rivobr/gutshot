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
  TournamentStatus,
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

  /**
   * Статусы, при которых игрок «занят» другим турниром.
   * После завершения турнира регистрация уходит в FINISHED — снова можно записываться.
   */
  private static readonly ACTIVE_REGISTRATION_STATUSES: RegistrationStatus[] = [
    RegistrationStatus.REGISTERED,
    RegistrationStatus.WAITING,
    RegistrationStatus.CHECKED_IN,
    RegistrationStatus.PLAYING,
  ];

  /** Эти статусы можно автоматически снять при записи на другой турнир. */
  private static readonly SWITCHABLE_REGISTRATION_STATUSES: RegistrationStatus[] = [
    RegistrationStatus.REGISTERED,
    RegistrationStatus.WAITING,
  ];

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

    if (tournament.status !== TournamentStatus.REGISTRATION_OPEN) {
      throw new BadRequestException('Регистрация закрыта');
    }

    const existing = await this.prisma.registration.findUnique({
      where: { userId_tournamentId: { userId, tournamentId } },
    });

    if (existing && existing.status !== RegistrationStatus.CANCELLED) {
      throw new ConflictException('Игрок уже зарегистрирован на этот турнир');
    }

    // Один активный турнир на игрока: старую запись снимаем (или блокируем, если уже играют).
    const cancelledPrevious = await this.releaseOtherActiveRegistrations(userId, tournamentId);

    const activeCount = await this.prisma.registration.count({
      where: {
        tournamentId,
        status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN] },
      },
    });

    const hasFreeSlot = activeCount < tournament.maxPlayers;
    const status = hasFreeSlot ? RegistrationStatus.REGISTERED : RegistrationStatus.WAITING;

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
        cancelledPrevious: cancelledPrevious?.title ?? null,
      },
    });

    if (status === RegistrationStatus.REGISTERED) {
      const base = this.telegramService.templates.registrationSuccess(tournament.title);
      const message = cancelledPrevious
        ? `${base}\n\nПредыдущая запись на «${cancelledPrevious.title}» отменена — можно быть записанным только на один турнир.`
        : base;
      await this.notificationsService.notify({
        userId: user.id,
        telegramId: user.telegramId,
        type: NotificationType.REGISTRATION,
        title: 'Регистрация подтверждена',
        message,
      });
    } else {
      await this.notificationsService.notify({
        userId: user.id,
        telegramId: user.telegramId,
        type: NotificationType.REGISTRATION,
        title: 'Лист ожидания',
        message: `⏳ Свободных мест нет. Вы поставлены в лист ожидания турнира «${tournament.title}».`,
      });
    }

    return {
      ...registration,
      cancelledPrevious,
    };
  }

  /**
   * Снимает активные записи игрока с других незавершённых турниров.
   * Если игрок уже отметился / играет — новую запись запрещаем.
   */
  private async releaseOtherActiveRegistrations(
    userId: string,
    tournamentId: string,
  ): Promise<{ tournamentId: string; title: string } | null> {
    const others = await this.prisma.registration.findMany({
      where: {
        userId,
        tournamentId: { not: tournamentId },
        status: { in: RegistrationsService.ACTIVE_REGISTRATION_STATUSES },
        tournament: {
          status: {
            notIn: [TournamentStatus.FINISHED, TournamentStatus.ARCHIVED],
          },
        },
      },
      include: { tournament: true, user: true },
      orderBy: { registeredAt: 'desc' },
    });

    if (others.length === 0) {
      return null;
    }

    const locked = others.find(
      (row) =>
        row.status === RegistrationStatus.CHECKED_IN || row.status === RegistrationStatus.PLAYING,
    );
    if (locked) {
      throw new ConflictException(
        `Вы уже участвуете в турнире «${locked.tournament.title}». Дождитесь его окончания, чтобы записаться на другой.`,
      );
    }

    let cancelledPrevious: { tournamentId: string; title: string } | null = null;

    for (const other of others) {
      if (!RegistrationsService.SWITCHABLE_REGISTRATION_STATUSES.includes(other.status)) {
        continue;
      }

      const promoted = await this.cancelRegistrationAndPromote(other.id);

      if (!cancelledPrevious) {
        cancelledPrevious = {
          tournamentId: other.tournamentId,
          title: other.tournament.title,
        };
      }

      await this.playerEventsService.record({
        userId: other.userId,
        type: PlayerEventType.TOURNAMENT_CANCELLED,
        tournamentId: other.tournamentId,
        metadata: {
          title: other.tournament.title,
          reason: 'switched_to_another_tournament',
          nextTournamentId: tournamentId,
        },
      });

      if (promoted) {
        await this.notificationsService.notify({
          userId: promoted.userId,
          telegramId: promoted.user.telegramId,
          type: NotificationType.REGISTRATION,
          title: 'Вы в основном списке',
          message: this.telegramService.templates.movedFromWaiting(other.tournament.title),
        });
      }
    }

    return cancelledPrevious;
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

  async getCurrent(userId: string): Promise<Registration | null> {
    return this.prisma.registration.findFirst({
      where: {
        userId,
        status: {
          in: [
            RegistrationStatus.REGISTERED,
            RegistrationStatus.CHECKED_IN,
            RegistrationStatus.PLAYING,
            RegistrationStatus.WAITING,
          ],
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
