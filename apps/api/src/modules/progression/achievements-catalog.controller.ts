import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ACHIEVEMENTS_CATALOG } from '../../common/constants/achievements-catalog';
import { Public } from '../../common/decorators/public.decorator';

/** Каталог достижений клуба — единый источник для Mini App. */
@ApiTags('Achievements')
@Controller('achievements')
export class AchievementsCatalogController {
  @Public()
  @Get('catalog')
  getCatalog() {
    return ACHIEVEMENTS_CATALOG;
  }
}
