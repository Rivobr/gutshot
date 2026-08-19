import { Module } from '@nestjs/common';
import { ProgressionModule } from '../progression/progression.module';
import { TelegramModule } from '../telegram/telegram.module';
import { UsersService } from './users.service';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';
import { PlayersController } from './players.controller';

@Module({
  imports: [ProgressionModule, TelegramModule],
  controllers: [ProfileController, PlayersController],
  providers: [UsersService, ProfileService],
  exports: [UsersService],
})
export class UsersModule {}
