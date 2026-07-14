import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType, RegistrationStatus, TournamentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { NotificationsService } from '../telegram/notifications.service';

const REMINDER_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 часа

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendUpcomingReminders(): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

    const tournaments = await this.prisma.tournament.findMany({
      where: {
        reminderSentAt: null,
        date: { gt: now, lte: windowEnd },
        status: {
          in: [
            TournamentStatus.REGISTRATION_OPEN,
            TournamentStatus.REGISTRATION_CLOSED,
          ],
        },
      },
      include: {
        registrations: {
          where: {
            status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN] },
          },
          include: { user: true },
        },
      },
    });

    for (const tournament of tournaments) {
      // Атомарно помечаем как отправленное, чтобы избежать дублей при параллельном запуске.
      const claim = await this.prisma.tournament.updateMany({
        where: { id: tournament.id, reminderSentAt: null },
        data: { reminderSentAt: now },
      });

      if (claim.count === 0) {
        continue;
      }

      for (const registration of tournament.registrations) {
        await this.notificationsService.notify({
          userId: registration.userId,
          telegramId: registration.user.telegramId,
          type: NotificationType.REMINDER,
          title: 'Напоминание о турнире',
          message: this.telegramService.templates.reminder(tournament.title),
        });
      }

      this.logger.log(
        `Отправлены напоминания по турниру "${tournament.title}" (${tournament.registrations.length} игроков)`,
      );
    }
  }
}
