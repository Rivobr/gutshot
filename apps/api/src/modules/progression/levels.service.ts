import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateLevelProgress } from '../../common/utils/level.util';
import { DEFAULT_LEVEL_THRESHOLDS } from '../../common/constants/xp-defaults.constants';

export interface LevelProgress {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
}

export interface LevelThresholdInput {
  level: number;
  requiredXp: number;
  title?: string | null;
}

/**
 * Таблица уровней, редактируемая из админ-панели. Если таблица пуста,
 * используется историческая формула из level.util, поэтому обновление
 * не меняет уровни уже существующих игроков.
 */
@Injectable()
export class LevelsService {
  private cache: LevelThresholdInput[] | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async getThresholds(): Promise<LevelThresholdInput[]> {
    if (this.cache) {
      return this.cache;
    }

    const rows = await this.prisma.levelThreshold.findMany({ orderBy: { level: 'asc' } });
    this.cache = rows.map((row) => ({
      level: row.level,
      requiredXp: row.requiredXp,
      title: row.title,
    }));

    return this.cache;
  }

  /**
   * Синхронный расчет уровня по заранее загруженной таблице —
   * позволяет обработать список игроков без запроса на каждого.
   */
  computeProgress(thresholds: LevelThresholdInput[], xp: number): LevelProgress {
    if (thresholds.length === 0) {
      return calculateLevelProgress(xp);
    }

    const safeXp = Math.max(xp, 0);
    const sorted = [...thresholds].sort((a, b) => a.level - b.level);

    let currentIndex = 0;
    for (let i = 0; i < sorted.length; i += 1) {
      if (safeXp >= sorted[i].requiredXp) {
        currentIndex = i;
      }
    }

    const current = sorted[currentIndex];
    const next = sorted[currentIndex + 1];

    if (!next) {
      return {
        level: current.level,
        currentLevelXp: current.requiredXp,
        nextLevelXp: current.requiredXp,
        progress: 1,
      };
    }

    const span = next.requiredXp - current.requiredXp;
    const progress = span > 0 ? (safeXp - current.requiredXp) / span : 1;

    return {
      level: current.level,
      currentLevelXp: current.requiredXp,
      nextLevelXp: next.requiredXp,
      progress: Math.min(Math.max(progress, 0), 1),
    };
  }

  async getProgress(xp: number): Promise<LevelProgress> {
    return this.computeProgress(await this.getThresholds(), xp);
  }

  async getLevel(xp: number): Promise<number> {
    return (await this.getProgress(xp)).level;
  }

  /** Полностью заменяет таблицу уровней переданным набором. */
  async replace(levels: LevelThresholdInput[]): Promise<LevelThresholdInput[]> {
    const normalized = [...levels].sort((a, b) => a.level - b.level);

    await this.prisma.$transaction(async (tx) => {
      await tx.levelThreshold.deleteMany({
        where: { level: { notIn: normalized.map((item) => item.level) } },
      });

      for (const item of normalized) {
        await tx.levelThreshold.upsert({
          where: { level: item.level },
          update: { requiredXp: item.requiredXp, title: item.title ?? null },
          create: { level: item.level, requiredXp: item.requiredXp, title: item.title ?? null },
        });
      }
    });

    this.invalidate();
    return this.getThresholds();
  }

  /** Заполняет таблицу значениями по умолчанию, если она пуста. */
  async ensureDefaults(): Promise<void> {
    const count = await this.prisma.levelThreshold.count();

    if (count > 0) {
      return;
    }

    await this.prisma.levelThreshold.createMany({
      data: DEFAULT_LEVEL_THRESHOLDS,
      skipDuplicates: true,
    });

    this.invalidate();
  }

  invalidate(): void {
    this.cache = null;
  }
}
