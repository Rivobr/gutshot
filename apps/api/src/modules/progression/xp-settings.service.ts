import { Injectable } from '@nestjs/common';
import { XpSettingKey } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_XP_SETTINGS } from '../../common/constants/xp-defaults.constants';

export type XpSettings = Record<XpSettingKey, number>;

/**
 * Настраиваемые значения XP. Читаются из БД, кешируются в памяти процесса
 * и сбрасываются при любом изменении из админ-панели.
 */
@Injectable()
export class XpSettingsService {
  private cache: XpSettings | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<XpSettings> {
    if (this.cache) {
      return this.cache;
    }

    const rows = await this.prisma.xpSetting.findMany();
    const settings = { ...DEFAULT_XP_SETTINGS };

    for (const row of rows) {
      settings[row.key] = row.value;
    }

    this.cache = settings;
    return settings;
  }

  async getValue(key: XpSettingKey): Promise<number> {
    const settings = await this.getAll();
    return settings[key] ?? DEFAULT_XP_SETTINGS[key] ?? 0;
  }

  /** Записывает переданные значения и сбрасывает кеш. */
  async update(entries: { key: XpSettingKey; value: number }[]): Promise<XpSettings> {
    await this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.xpSetting.upsert({
          where: { key: entry.key },
          update: { value: entry.value },
          create: { key: entry.key, value: entry.value },
        }),
      ),
    );

    this.invalidate();
    return this.getAll();
  }

  /** Создает отсутствующие ключи со значениями по умолчанию. */
  async ensureDefaults(): Promise<void> {
    const existing = await this.prisma.xpSetting.findMany({ select: { key: true } });
    const known = new Set(existing.map((row) => row.key));
    const missing = (Object.keys(DEFAULT_XP_SETTINGS) as XpSettingKey[]).filter(
      (key) => !known.has(key),
    );

    if (missing.length === 0) {
      return;
    }

    await this.prisma.xpSetting.createMany({
      data: missing.map((key) => ({ key, value: DEFAULT_XP_SETTINGS[key] })),
      skipDuplicates: true,
    });

    this.invalidate();
  }

  invalidate(): void {
    this.cache = null;
  }
}
