import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { ProgressionModule } from '../progression/progression.module';
import { UsersModule } from '../users/users.module';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { AdminPlayersController } from './players/players.controller';
import { AdminPlayersService } from './players/players.service';
import { AdminTournamentsController } from './tournaments/admin-tournaments.controller';
import { AdminTournamentsService } from './tournaments/admin-tournaments.service';
import { StatisticsController } from './statistics/statistics.controller';
import { StatisticsService } from './statistics/statistics.service';
import { ScannerController } from './scanner/scanner.controller';
import { ScannerService } from './scanner/scanner.service';
import { AttendanceService } from './attendance/attendance.service';
import { XpSettingsController } from './xp-settings/xp-settings.controller';
import { AdminHistoryController } from './history/admin-history.controller';
import { AdminBroadcastController } from './broadcast/broadcast.controller';
import { AdminBroadcastService } from './broadcast/broadcast.service';

@Module({
  imports: [TelegramModule, RegistrationsModule, ProgressionModule, UsersModule],
  controllers: [
    DashboardController,
    AdminPlayersController,
    AdminTournamentsController,
    StatisticsController,
    ScannerController,
    XpSettingsController,
    AdminHistoryController,
    AdminBroadcastController,
  ],
  providers: [
    DashboardService,
    AdminPlayersService,
    AdminTournamentsService,
    StatisticsService,
    ScannerService,
    AttendanceService,
    AdminBroadcastService,
  ],
})
export class AdminModule {}
