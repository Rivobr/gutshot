import { Logger, Module, OnModuleInit } from '@nestjs/common';
import {
  AdminLegalDocumentsController,
  LegalDocumentsController,
} from './legal-documents.controller';
import { LegalDocumentsService } from './legal-documents.service';

@Module({
  controllers: [LegalDocumentsController, AdminLegalDocumentsController],
  providers: [LegalDocumentsService],
  exports: [LegalDocumentsService],
})
export class LegalModule implements OnModuleInit {
  private readonly logger = new Logger(LegalModule.name);

  constructor(private readonly legalDocumentsService: LegalDocumentsService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.legalDocumentsService.ensureDefaults();
    } catch (error) {
      this.logger.warn(
        `Не удалось создать документы по умолчанию: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
