import { Module } from '@nestjs/common';
import { ProgressionModule } from '../progression/progression.module';
import { UsersService } from './users.service';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';

@Module({
  imports: [ProgressionModule],
  controllers: [ProfileController],
  providers: [UsersService, ProfileService],
  exports: [UsersService],
})
export class UsersModule {}
