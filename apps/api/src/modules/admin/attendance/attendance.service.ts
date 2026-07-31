import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PlayerEventType, RegistrationStatus, XPReason, XpSettingKey } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaTransaction } from '../../../common/types/prisma-transaction.type';
import { XpService } from '../../progression/xp.service';
import { XpSettingsService } from '../../progression/xp-settings.service';
import { PlayerEventsService } from '../../progression/player-events.service';

export interface AttendanceRegistration {
  id: string;
  userId: string;
  tournamentId: string;
  attendanceXpGiven: boolean;
}

/**
 * Отметка явки игрока. Единственное место, где реализовано правило
 * «XP за посещение начисляется не более одного раза на регистрацию».
 */
@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xpService: XpService,
    private readonly xpSettingsService: XpSettingsService,
    private readonly playerEventsService: PlayerEventsService,
  ) {}

  /**
   * Отмечает явку внутри переданной транзакции и возвращает фактически
   * начисленный XP: 0, если посещение уже было засчитано ранее.
   */
  async applyArrival(
    tx: PrismaTransaction,
    registration: AttendanceRegistration,
  ): Promise<number> {
    if (registration.attendanceXpGiven) {
      await tx.registration.update({
        where: { id: registration.id },
        data: { status: RegistrationStatus.CHECKED_IN },
      });
      return 0;
    }

    const now = new Date();

    await tx.registration.update({
      where: { id: registration.id },
      data: {
        status: RegistrationStatus.CHECKED_IN,
        arrivedAt: now,
        checkedInAt: now,
        attendanceXpGiven: true,
      },
    });

    return this.xpSettingsService.getValue(XpSettingKey.ATTENDANCE);
  }

  /**
   * Отметка явки со страницы турнира в админ-панели.
   * Снятие отметки не отзывает уже начисленный XP, но фиксируется в истории.
   */
  async markAttendance(registrationId: string, arrived: boolean, adminId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { user: true },
    });

    if (!registration) {
      throw new NotFoundException('Регистрация не найдена');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Регистрация отменена');
    }

    if (!arrived) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.registration.update({
          where: { id: registrationId },
          data: { status: RegistrationStatus.NO_SHOW, arrivedAt: null },
        });

        await this.playerEventsService.log(tx, {
          userId: registration.userId,
          type: PlayerEventType.XP_CHANGE,
          tournamentId: registration.tournamentId,
          xpAmount: 0,
          performedById: adminId,
          metadata: { label: 'Отметка «не пришел»', attendanceXpKept: registration.attendanceXpGiven },
        });

        return { registration: updated, xpAwarded: 0, levelUp: false };
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const xpAmount = await this.applyArrival(tx, registration);

      const award = await this.xpService.award(tx, {
        userId: registration.userId,
        amount: xpAmount,
        reason: XPReason.ATTENDANCE,
        eventType: PlayerEventType.ARRIVED,
        tournamentId: registration.tournamentId,
        performedById: adminId,
        metadata: { label: 'Явка на турнир', duplicate: xpAmount === 0 },
      });

      const updated = await tx.registration.findUniqueOrThrow({ where: { id: registrationId } });

      return { registration: updated, xpAwarded: award.xpAwarded, levelUp: award.levelUp };
    });
  }
}
