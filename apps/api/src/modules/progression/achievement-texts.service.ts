import { Injectable, NotFoundException } from '@nestjs/common';
import { AchievementText } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { REMOVED_ACHIEVEMENT_IDS } from '../../common/constants/achievements-catalog';
import {
  ACHIEVEMENT_TEXT_ORDER,
  DEFAULT_ACHIEVEMENT_TEXTS,
} from './achievement-texts.defaults';

@Injectable()
export class AchievementTextsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AchievementText[]> {
    const rows = await this.prisma.achievementText.findMany();
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ACHIEVEMENT_TEXT_ORDER.map((id) => byId.get(id)).filter(
      (row): row is AchievementText => !!row,
    );
  }

  async findOne(id: string): Promise<AchievementText> {
    const row = await this.prisma.achievementText.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Достижение не найдено');
    }
    return row;
  }

  async upsert(
    id: string,
    data: { icon: string; title: string; description: string; howTo: string },
    adminId: string,
  ): Promise<AchievementText> {
    if (!DEFAULT_ACHIEVEMENT_TEXTS[id]) {
      throw new NotFoundException('Достижение не найдено');
    }

    return this.prisma.achievementText.upsert({
      where: { id },
      update: {
        icon: data.icon,
        title: data.title,
        description: data.description,
        howTo: data.howTo,
        updatedById: adminId,
      },
      create: {
        id,
        icon: data.icon,
        title: data.title,
        description: data.description,
        howTo: data.howTo,
        updatedById: adminId,
      },
    });
  }

  async ensureDefaults(): Promise<void> {
    await this.prisma.achievementText.deleteMany({
      where: { id: { in: [...REMOVED_ACHIEVEMENT_IDS] } },
    });

    const existing = await this.prisma.achievementText.findMany({ select: { id: true } });
    const known = new Set(existing.map((row) => row.id));
    const missing = ACHIEVEMENT_TEXT_ORDER.filter((id) => !known.has(id));

    if (missing.length > 0) {
      await this.prisma.achievementText.createMany({
        data: missing.map((id) => ({
          id,
          ...DEFAULT_ACHIEVEMENT_TEXTS[id],
        })),
        skipDuplicates: true,
      });
    }
  }
}
