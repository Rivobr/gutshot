import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationType, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QrService } from '../../qr/qr.service';
import { TelegramService } from '../../telegram/telegram.service';
import { NotificationsService } from '../../telegram/notifications.service';

@Injectable()
export class CheckInService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qrService: QrService,
    private readonly telegramService: TelegramService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async checkIn(token: string) {
    const qrToken = await this.qrService.validateAndConsume(token);

    const registration = await this.prisma.registration.findUnique({
      where: { id: qrToken.registrationId },
      include: { user: true, tournament: true },
    });

    if (!registration) {
      throw new BadRequestException('Регистрация не найдена');
    }

    if (registration.status !== RegistrationStatus.REGISTERED) {
      throw new BadRequestException('Регистрация не находится в статусе REGISTERED');
    }

    const updated = await this.prisma.registration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.CHECKED_IN, checkedInAt: new Date() },
      include: { user: true, tournament: true },
    });

    await this.notificationsService.notify({
      userId: registration.user.id,
      telegramId: registration.user.telegramId,
      type: NotificationType.TOURNAMENT_START,
      title: 'Check-in выполнен',
      message: this.telegramService.templates.checkedIn(),
    });

    return {
      registrationId: updated.id,
      status: updated.status,
      player: {
        id: updated.user.id,
        firstName: updated.user.firstName,
        lastName: updated.user.lastName,
        photoUrl: updated.user.photoUrl,
      },
      tournament: {
        id: updated.tournament.id,
        title: updated.tournament.title,
      },
      checkedInAt: updated.checkedInAt,
    };
  }
}
