import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '../../../common/enums/admin-role.enum';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminJwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ScannerService } from './scanner.service';
import { ScannerEventDto } from './dto/scanner.dto';

@ApiTags('Admin / QR Scanner')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.OWNER, AdminRole.ADMIN, AdminRole.DEALER, AdminRole.MANAGER)
@Controller('admin/scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  /** Карточка игрока по постоянному QR-коду. */
  @Get('player/:qrCode')
  findPlayer(@Param('qrCode') qrCode: string) {
    return this.scannerService.findPlayer(qrCode);
  }

  /** Отметка события турнира для отсканированного игрока. */
  @Post('event')
  applyEvent(@CurrentUser() admin: AdminJwtPayload, @Body() dto: ScannerEventDto) {
    return this.scannerService.applyEvent(
      dto.qrCode,
      dto.event,
      admin.sub,
      dto.tournamentId,
      dto.reEntryKind,
    );
  }
}
