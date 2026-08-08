import { BadRequestException, Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { XpSettingKey } from '@prisma/client';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminRole } from '../../../common/enums/admin-role.enum';
import { XpSettingsService } from '../../progression/xp-settings.service';
import { LevelsService } from '../../progression/levels.service';
import { UpdateLevelsDto, UpdateXpSettingsDto } from './dto/xp-settings.dto';

@ApiTags('Admin / XP Settings')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.OWNER, AdminRole.ADMIN)
@Controller('admin/xp-settings')
export class XpSettingsController {
  constructor(
    private readonly xpSettingsService: XpSettingsService,
    private readonly levelsService: LevelsService,
  ) {}

  /** Текущие значения XP и таблица уровней. */
  @Get()
  async getConfig() {
    const [settings, levels] = await Promise.all([
      this.xpSettingsService.getAll(),
      this.levelsService.getThresholds(),
    ]);

    return {
      settings: (Object.keys(settings) as XpSettingKey[]).map((key) => ({
        key,
        value: settings[key],
      })),
      levels,
    };
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Put()
  async updateSettings(@Body() dto: UpdateXpSettingsDto) {
    const keys = new Set(dto.settings.map((entry) => entry.key));

    if (keys.size !== dto.settings.length) {
      throw new BadRequestException('Ключи настроек не должны повторяться');
    }

    const settings = await this.xpSettingsService.update(dto.settings);

    return (Object.keys(settings) as XpSettingKey[]).map((key) => ({
      key,
      value: settings[key],
    }));
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Put('levels')
  async updateLevels(@Body() dto: UpdateLevelsDto) {
    const levels = [...dto.levels].sort((a, b) => a.level - b.level);
    const uniqueLevels = new Set(levels.map((item) => item.level));

    if (uniqueLevels.size !== levels.length) {
      throw new BadRequestException('Уровни не должны повторяться');
    }

    if (levels[0].level !== 1 || levels[0].requiredXp !== 0) {
      throw new BadRequestException('Первый уровень должен начинаться с 0 XP');
    }

    for (let i = 1; i < levels.length; i += 1) {
      if (levels[i].requiredXp <= levels[i - 1].requiredXp) {
        throw new BadRequestException(
          `Порог уровня ${levels[i].level} должен быть больше порога предыдущего уровня`,
        );
      }
    }

    return this.levelsService.replace(levels);
  }
}
