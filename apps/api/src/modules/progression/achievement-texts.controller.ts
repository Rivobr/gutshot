import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminJwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../common/enums/admin-role.enum';
import { AchievementTextsService } from './achievement-texts.service';
import { UpsertAchievementTextDto } from './dto/achievement-text.dto';

@ApiTags('Achievement Texts')
@Controller('achievement-texts')
export class AchievementTextsController {
  constructor(private readonly achievementTextsService: AchievementTextsService) {}

  @Public()
  @Get()
  findAll() {
    return this.achievementTextsService.findAll();
  }
}

@ApiTags('Admin / Achievement Texts')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Controller('admin/achievement-texts')
export class AdminAchievementTextsController {
  constructor(private readonly achievementTextsService: AchievementTextsService) {}

  @Get()
  findAll() {
    return this.achievementTextsService.findAll();
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Put(':id')
  upsert(
    @CurrentUser() admin: AdminJwtPayload,
    @Param('id') id: string,
    @Body() dto: UpsertAchievementTextDto,
  ) {
    return this.achievementTextsService.upsert(id, dto, admin.sub);
  }
}
