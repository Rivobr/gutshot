import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { XpSettingsService } from './xp-settings.service';
import { LevelsService } from './levels.service';
import { XpService } from './xp.service';
import { PlayerEventsService } from './player-events.service';
import { AchievementsService } from './achievements.service';
import { AchievementTextsService } from './achievement-texts.service';
import {
  AchievementTextsController,
  AdminAchievementTextsController,
} from './achievement-texts.controller';

/**
 * Прогрессия игрока: настраиваемые значения XP, таблица уровней,
 * начисление опыта, достижения и история событий.
 */
@Module({
  controllers: [AchievementTextsController, AdminAchievementTextsController],
  providers: [
    XpSettingsService,
    LevelsService,
    XpService,
    PlayerEventsService,
    AchievementsService,
    AchievementTextsService,
  ],
  exports: [
    XpSettingsService,
    LevelsService,
    XpService,
    PlayerEventsService,
    AchievementsService,
    AchievementTextsService,
  ],
})
export class ProgressionModule implements OnModuleInit {
  private readonly logger = new Logger(ProgressionModule.name);

  constructor(
    private readonly xpSettingsService: XpSettingsService,
    private readonly levelsService: LevelsService,
    private readonly achievementTextsService: AchievementTextsService,
  ) {}

  /**
   * При старте заполняет настройки значениями по умолчанию, если их еще нет.
   * Ошибка (например, непримененные миграции) не должна ронять приложение —
   * сервисы умеют работать на значениях по умолчанию.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.xpSettingsService.ensureDefaults();
      await this.levelsService.ensureDefaults();
      await this.achievementTextsService.ensureDefaults();
    } catch (error) {
      this.logger.warn(
        `Не удалось инициализировать настройки прогрессии: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
