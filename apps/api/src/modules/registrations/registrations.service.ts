import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  Registration,
  RegistrationStatus,
  TournamentStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QrService } from '../qr/qr.service';
import { TelegramService } from '../telegram/telegram.service';
import { NotificationsService } from '../telegram/notifications.service';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qrService: QrService,
    private readonly telegramService: TelegramService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(userId: string, tournamentId: string): Promise<Registration> {
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

    if (status === RegistrationStatus.REGISTERED) {
      await this.qrService.getOrCreateActiveToken(registration.id);
      await this.notificationsService.notify({
        userId: user.id,
        telegramId: user.telegramId,
        type: NotificationType.REGISTRATION,
        title: 'Регистрация подтверждена',
        message: this.telegramService.templates.registrationSuccess(tournament.title),
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

    return registration;
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

    const promoted = await this.prisma.$transaction(async (tx) => {
      await tx.registration.update({
        where: { id: registrationId },
        data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
      });

      await this.qrService.invalidate(registrationId);

      const wasActiveSlot = registration.status === RegistrationStatus.REGISTERED;

      if (!wasActiveSlot) {
        return null;
      }

      const nextWaiting = await tx.registration.findFirst({
        where: { tournamentId: registration.tournamentId, status: RegistrationStatus.WAITING },
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

    // Отправка уведомлений и генерация QR — после коммита транзакции.
    if (promoted) {
      await this.qrService.getOrCreateActiveToken(promoted.id);
      await this.notificationsService.notify({
        userId: promoted.userId,
        telegramId: promoted.user.telegramId,
        type: NotificationType.REGISTRATION,
        title: 'Вы в основном списке',
        message: this.telegramService.templates.movedFromWaiting(registration.tournament.title),
      });
    }

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

  async getCurrentQr(userId: string) {
    const registration = await this.getCurrent(userId);

    if (!registration || registration.status !== RegistrationStatus.REGISTERED) {
      throw new NotFoundException('Активная регистрация не найдена');
    }

    const qrToken = await this.qrService.getOrCreateActiveToken(registration.id);

    return {
      token: qrToken.token,
      expiresAt: qrToken.expiresAt,
    };
  }

  async findByTournament(tournamentId: string) {
    return this.prisma.registration.findMany({
      where: { tournamentId },
      include: { user: true },
      orderBy: { registeredAt: 'asc' },
    });
  }
}
