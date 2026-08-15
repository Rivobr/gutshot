import { Injectable, NotFoundException } from '@nestjs/common';
import { LegalDocument, LegalDocumentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Заголовки и заглушки документов, создаваемые при первом запуске. */
export const DEFAULT_LEGAL_DOCUMENTS: Record<LegalDocumentType, string> = {
  CLUB_RULES: 'Правила клуба',
  USER_AGREEMENT: 'Публичная оферта',
  PERSONAL_DATA_CONSENT: 'Политика обработки персональных данных',
  MEDIA_CONSENT: 'Согласие на фото- и видеосъемку',
};

@Injectable()
export class LegalDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<LegalDocument[]> {
    return this.prisma.legalDocument.findMany({ orderBy: { type: 'asc' } });
  }

  async findOne(type: LegalDocumentType): Promise<LegalDocument> {
    const document = await this.prisma.legalDocument.findUnique({ where: { type } });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    return document;
  }

  /**
   * Сохраняет документ. Версия увеличивается при каждом изменении текста,
   * поэтому Mini App может определить, что документ обновился.
   */
  async upsert(
    type: LegalDocumentType,
    data: { title: string; content: string },
    adminId: string,
  ): Promise<LegalDocument> {
    const existing = await this.prisma.legalDocument.findUnique({ where: { type } });
    const contentChanged = !existing || existing.content !== data.content;

    return this.prisma.legalDocument.upsert({
      where: { type },
      update: {
        title: data.title,
        content: data.content,
        updatedById: adminId,
        ...(contentChanged && existing ? { version: existing.version + 1 } : {}),
      },
      create: {
        type,
        title: data.title,
        content: data.content,
        updatedById: adminId,
      },
    });
  }

  /** Создает недостающие документы-заглушки, чтобы админ мог их отредактировать. */
  async ensureDefaults(): Promise<void> {
    const existing = await this.prisma.legalDocument.findMany({ select: { type: true } });
    const known = new Set(existing.map((row) => row.type));
    const missing = (Object.keys(DEFAULT_LEGAL_DOCUMENTS) as LegalDocumentType[]).filter(
      (type) => !known.has(type),
    );

    if (missing.length === 0) {
      return;
    }

    await this.prisma.legalDocument.createMany({
      data: missing.map((type) => ({
        type,
        title: DEFAULT_LEGAL_DOCUMENTS[type],
        content: 'Текст документа еще не заполнен. Отредактируйте его в админ-панели.',
      })),
      skipDuplicates: true,
    });
  }
}
