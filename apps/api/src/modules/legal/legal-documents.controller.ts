import { Body, Controller, Get, Param, ParseEnumPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LegalDocumentType } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminJwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../common/enums/admin-role.enum';
import { LegalDocumentsService } from './legal-documents.service';
import { UpsertLegalDocumentDto } from './dto/legal-document.dto';

/**
 * Публичное чтение документов — Mini App показывает актуальные тексты
 * до авторизации, на экране принятия соглашений.
 */
@ApiTags('Legal Documents')
@Controller('legal-documents')
export class LegalDocumentsController {
  constructor(private readonly legalDocumentsService: LegalDocumentsService) {}

  @Public()
  @Get()
  findAll() {
    return this.legalDocumentsService.findAll();
  }

  @Public()
  @Get(':type')
  findOne(
    @Param('type', new ParseEnumPipe(LegalDocumentType)) type: LegalDocumentType,
  ) {
    return this.legalDocumentsService.findOne(type);
  }
}

@ApiTags('Admin / Legal Documents')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Controller('admin/legal-documents')
export class AdminLegalDocumentsController {
  constructor(private readonly legalDocumentsService: LegalDocumentsService) {}

  @Get()
  findAll() {
    return this.legalDocumentsService.findAll();
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Put(':type')
  upsert(
    @CurrentUser() admin: AdminJwtPayload,
    @Param('type', new ParseEnumPipe(LegalDocumentType)) type: LegalDocumentType,
    @Body() dto: UpsertLegalDocumentDto,
  ) {
    return this.legalDocumentsService.upsert(type, dto, admin.sub);
  }
}
