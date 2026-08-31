import { join, basename } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BroadcastDeliveryStatus, BroadcastSegment, BroadcastStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TelegramService } from '../../telegram/telegram.service';
import { CreateBroadcastDto, UpdateBroadcastDto } from './dto/broadcast.dto';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');
const BROADCAST_PHOTOS_DIR = 'broadcast';

type Recipient = { userId: string | null; telegramId: string; name: string };

type CampaignRow = {
  id: string;
  title: string;
  bodyHtml: string;
  segment: BroadcastSegment;
  targetTelegramId: string | null;
  photoPath: string | null;
  photoUrl: string | null;
  photoFileId: string | null;
  status: BroadcastStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function normalizeTelegramId(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

@Injectable()
export class AdminBroadcastService {
  private readonly logger = new Logger(AdminBroadcastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async list() {
    const items = await this.prisma.broadcastCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return items.map((item) => this.serializeCampaign(item));
  }

  async getById(id: string) {
    const campaign = await this.prisma.broadcastCampaign.findUnique({
      where: { id },
      include: {
        deliveries: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                nickname: true,
                firstName: true,
                username: true,
                telegramId: true,
              },
            },
          },
        },
      },
    });
    if (!campaign) {
      throw new NotFoundException('Рассылка не найдена');
    }
    return {
      ...this.serializeCampaign(campaign),
      deliveries: campaign.deliveries.map((d) => ({
        id: d.id,
        userId: d.userId,
        telegramId: d.telegramId,
        status: d.status,
        telegramMessageId: d.telegramMessageId,
        chatId: d.chatId,
        error: d.error,
        sentAt: d.sentAt?.toISOString() ?? null,
        name: d.user?.nickname || d.user?.firstName || d.user?.username || d.telegramId,
      })),
    };
  }

  async preview(segment: BroadcastSegment, targetTelegramId?: string) {
    const recipients = await this.resolveRecipients(segment, targetTelegramId ?? null);
    return {
      segment,
      targetTelegramId: targetTelegramId ?? null,
      count: recipients.length,
      sample: recipients.slice(0, 10),
    };
  }

  async create(dto: CreateBroadcastDto, createdById?: string) {
    this.assertConfig(dto.segment, dto.targetTelegramId);
    const recipients = await this.resolveRecipients(dto.segment, dto.targetTelegramId ?? null);

    const campaign = await this.prisma.broadcastCampaign.create({
      data: {
        title: dto.title.trim(),
        bodyHtml: dto.bodyHtml.trim(),
        segment: dto.segment,
        targetTelegramId:
          dto.segment === BroadcastSegment.SINGLE_PLAYER
            ? normalizeTelegramId(dto.targetTelegramId ?? '')
            : null,
        photoPath: dto.photoPath?.trim() || null,
        createdById: createdById || null,
        recipientCount: recipients.length,
        status: BroadcastStatus.DRAFT,
      },
    });

    return this.serializeCampaign(campaign);
  }

  async update(id: string, dto: UpdateBroadcastDto) {
    const existing = await this.prisma.broadcastCampaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Рассылка не найдена');
    }
    if (existing.status !== BroadcastStatus.DRAFT && existing.status !== BroadcastStatus.FAILED) {
      throw new BadRequestException('Можно менять только черновик');
    }

    const segment = dto.segment ?? existing.segment;
    const targetTelegramId =
      dto.targetTelegramId === undefined
        ? existing.targetTelegramId
        : dto.targetTelegramId
          ? normalizeTelegramId(dto.targetTelegramId)
          : null;
    this.assertConfig(segment, targetTelegramId);
    const recipients = await this.resolveRecipients(segment, targetTelegramId);

    const campaign = await this.prisma.broadcastCampaign.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        bodyHtml: dto.bodyHtml?.trim(),
        segment,
        targetTelegramId: segment === BroadcastSegment.SINGLE_PLAYER ? targetTelegramId : null,
        photoPath: dto.photoPath === undefined ? existing.photoPath : dto.photoPath || null,
        photoFileId:
          dto.photoPath !== undefined && dto.photoPath !== existing.photoPath
            ? null
            : existing.photoFileId,
        recipientCount: recipients.length,
      },
    });

    return this.serializeCampaign(campaign);
  }

  /** Сохраняет загруженное фото в uploads/broadcast и возвращает относительный путь. */
  async savePhoto(
    file:
      | {
          buffer: Buffer;
          originalname: string;
          mimetype: string;
          size: number;
        }
      | undefined,
  ) {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('Файл фото не передан');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Можно загружать только изображения');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Фото больше 10 МБ');
    }

    const ext =
      MIME_BY_EXT[`.${file.originalname.split('.').pop()?.toLowerCase() ?? ''}`] === file.mimetype
        ? file.originalname.split('.').pop()?.toLowerCase()
        : (file.mimetype.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg');
    const name = `${randomUUID()}.${ext}`;
    const dir = join(UPLOADS_DIR, BROADCAST_PHOTOS_DIR);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), file.buffer);

    return { photoPath: `${BROADCAST_PHOTOS_DIR}/${name}` };
  }

  async send(id: string) {
    const campaign = await this.prisma.broadcastCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Рассылка не найдена');
    }
    if (campaign.status !== BroadcastStatus.DRAFT && campaign.status !== BroadcastStatus.FAILED) {
      throw new BadRequestException('Рассылка уже отправляется или отправлена');
    }

    this.assertConfig(campaign.segment, campaign.targetTelegramId);
    const recipients = await this.resolveRecipients(campaign.segment, campaign.targetTelegramId);
    if (recipients.length === 0) {
      throw new BadRequestException('Нет получателей');
    }

    await this.prisma.broadcastDelivery.deleteMany({ where: { campaignId: id } });
    await this.prisma.broadcastDelivery.createMany({
      data: recipients.map((r) => ({
        campaignId: id,
        userId: r.userId,
        telegramId: r.telegramId,
        status: BroadcastDeliveryStatus.PENDING,
      })),
    });

    await this.prisma.broadcastCampaign.update({
      where: { id },
      data: {
        status: BroadcastStatus.SENDING,
        recipientCount: recipients.length,
        sentCount: 0,
        failedCount: 0,
      },
    });

    let sentCount = 0;
    let failedCount = 0;
    let photoFileId = campaign.photoFileId;

    for (const recipient of recipients) {
      const result = await this.deliverOne(campaign, recipient.telegramId);

      if (result) {
        sentCount += 1;
        if (result.fileId && campaign.photoPath && !photoFileId) {
          photoFileId = result.fileId;
          await this.prisma.broadcastCampaign.update({
            where: { id },
            data: { photoFileId: result.fileId },
          });
        }
        await this.prisma.broadcastDelivery.updateMany({
          where: { campaignId: id, telegramId: recipient.telegramId },
          data: {
            status: BroadcastDeliveryStatus.SENT,
            telegramMessageId: result.messageId,
            chatId: String(result.chatId),
            sentAt: new Date(),
            error: null,
          },
        });
      } else {
        failedCount += 1;
        await this.prisma.broadcastDelivery.updateMany({
          where: { campaignId: id, telegramId: recipient.telegramId },
          data: {
            status: BroadcastDeliveryStatus.FAILED,
            error: 'Telegram delivery failed',
          },
        });
      }

      await new Promise((r) => setTimeout(r, 80));
    }

    const updated = await this.prisma.broadcastCampaign.update({
      where: { id },
      data: {
        status: sentCount > 0 ? BroadcastStatus.SENT : BroadcastStatus.FAILED,
        sentCount,
        failedCount,
        sentAt: new Date(),
      },
    });

    this.logger.log(
      `Broadcast ${id} done sent=${sentCount} failed=${failedCount} segment=${campaign.segment}`,
    );

    return this.serializeCampaign(updated);
  }

  /** Удалить все отправленные сообщения рассылки по сохранённым message_id. */
  async deleteMessages(id: string) {
    const campaign = await this.getById(id);
    let deleted = 0;
    let failed = 0;

    for (const delivery of campaign.deliveries) {
      if (
        delivery.status !== BroadcastDeliveryStatus.SENT ||
        delivery.telegramMessageId == null ||
        !delivery.chatId
      ) {
        continue;
      }
      const ok = await this.telegramService.deleteMessage(
        delivery.chatId,
        delivery.telegramMessageId,
      );
      if (ok) {
        deleted += 1;
        await this.prisma.broadcastDelivery.update({
          where: { id: delivery.id },
          data: { status: BroadcastDeliveryStatus.DELETED, error: null },
        });
      } else {
        failed += 1;
      }
      await new Promise((r) => setTimeout(r, 50));
    }

    return { deleted, failed, campaignId: id };
  }

  /** Удалить одно сообщение рассылки по message_id из доставки. */
  async deleteDeliveryMessage(id: string, deliveryId: string) {
    const delivery = await this.prisma.broadcastDelivery.findFirst({
      where: { id: deliveryId, campaignId: id },
    });
    if (!delivery) {
      throw new NotFoundException('Доставка не найдена');
    }
    if (delivery.status !== BroadcastDeliveryStatus.SENT || delivery.telegramMessageId == null) {
      throw new BadRequestException('У этой доставки нет отправленного сообщения');
    }
    if (!delivery.chatId) {
      throw new BadRequestException('Не сохранён chat_id — удалить сообщение нельзя');
    }

    const ok = await this.telegramService.deleteMessage(
      delivery.chatId,
      delivery.telegramMessageId,
    );
    if (!ok) {
      throw new BadRequestException('Telegram не смог удалить сообщение (возможно, уже удалено)');
    }

    await this.prisma.broadcastDelivery.update({
      where: { id: delivery.id },
      data: { status: BroadcastDeliveryStatus.DELETED, error: null },
    });

    return { ok: true, deliveryId: delivery.id, telegramMessageId: delivery.telegramMessageId };
  }

  async deleteDraft(id: string) {
    const existing = await this.prisma.broadcastCampaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Рассылка не найдена');
    }
    if (existing.status !== BroadcastStatus.DRAFT) {
      throw new BadRequestException('Можно удалить только черновик');
    }
    await this.prisma.broadcastCampaign.delete({ where: { id } });
    return { ok: true };
  }

  private async deliverOne(
    campaign: CampaignRow,
    telegramId: string,
  ): Promise<{ messageId: number; chatId: number; fileId?: string } | null> {
    if (campaign.photoPath) {
      if (campaign.photoFileId) {
        const byFileId = await this.telegramService.sendPhotoFileIdDetailed(
          telegramId,
          campaign.photoFileId,
          campaign.bodyHtml,
        );
        if (byFileId) {
          return byFileId;
        }
        // file_id протух — упадём ниже на загрузку файла с диска.
      }

      const absolutePath = join(UPLOADS_DIR, campaign.photoPath);
      let buffer: Buffer;
      try {
        buffer = await readFile(absolutePath);
      } catch {
        throw new BadRequestException('Файл фото не найден на сервере — загрузите фото заново');
      }
      const ext = basename(absolutePath).split('.').pop()?.toLowerCase() ?? 'jpg';
      return this.telegramService.sendPhotoFileDetailed(
        telegramId,
        {
          buffer,
          filename: basename(absolutePath),
          mimeType: MIME_BY_EXT[`.${ext}`] ?? 'image/jpeg',
        },
        campaign.bodyHtml,
      );
    }

    if (campaign.photoUrl?.trim()) {
      return this.telegramService.sendPhotoDetailed(
        telegramId,
        campaign.photoUrl.trim(),
        campaign.bodyHtml,
      );
    }

    return this.telegramService.sendMessageDetailed(telegramId, campaign.bodyHtml);
  }

  private assertConfig(segment: BroadcastSegment, targetTelegramId?: string | null) {
    if (segment !== BroadcastSegment.ALL_ACTIVE && segment !== BroadcastSegment.SINGLE_PLAYER) {
      throw new BadRequestException('Доступны только сегменты «Всем» и «Одному человеку»');
    }
    if (segment === BroadcastSegment.SINGLE_PLAYER && !targetTelegramId) {
      throw new BadRequestException('Укажите Telegram ID получателя');
    }
  }

  private async resolveRecipients(
    segment: BroadcastSegment,
    targetTelegramId: string | null,
  ): Promise<Recipient[]> {
    if (segment === BroadcastSegment.SINGLE_PLAYER) {
      const telegramId = normalizeTelegramId(targetTelegramId ?? '');
      if (!/^[0-9]{5,20}$/.test(telegramId)) {
        throw new BadRequestException('Укажите корректный Telegram ID');
      }
      const user = await this.prisma.user.findUnique({
        where: { telegramId },
        select: {
          id: true,
          telegramId: true,
          nickname: true,
          firstName: true,
          username: true,
          isBlocked: true,
        },
      });
      if (user?.isBlocked) {
        throw new BadRequestException('Этот игрок заблокирован');
      }
      return [
        {
          userId: user?.id ?? null,
          telegramId,
          name: user?.nickname || user?.firstName || user?.username || telegramId,
        },
      ];
    }

    const users = await this.prisma.user.findMany({
      where: {
        isBlocked: false,
        telegramId: { not: '' },
      },
      select: {
        id: true,
        telegramId: true,
        nickname: true,
        firstName: true,
        username: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users
      .filter((u) => /^[0-9]{6,}$/.test(u.telegramId))
      .filter((u) => !['000000001', '999000111'].includes(u.telegramId))
      .map((u) => ({
        userId: u.id,
        telegramId: u.telegramId,
        name: u.nickname || u.firstName || u.username || u.telegramId,
      }));
  }

  private serializeCampaign(campaign: CampaignRow) {
    return {
      id: campaign.id,
      title: campaign.title,
      bodyHtml: campaign.bodyHtml,
      segment: campaign.segment,
      targetTelegramId: campaign.targetTelegramId ?? null,
      photoPath: campaign.photoPath ?? null,
      photoUrl: campaign.photoUrl ?? null,
      status: campaign.status,
      recipientCount: campaign.recipientCount,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      sentAt: campaign.sentAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };
  }
}
