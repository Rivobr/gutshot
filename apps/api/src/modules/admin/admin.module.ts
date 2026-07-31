import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { QrModule } from '../qr/qr.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { ProgressionModule } from '../progression/progression.module';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { AdminPlayersController } from './players/players.controller';
import { AdminPlayersService } from './players/players.service';
import { AdminTournamentsController } from './tournaments/admin-tournaments.controller';
import { AdminTournamentsService } from './tournaments/admin-tournaments.service';
import { CheckInController } from './check-in/check-in.controller';
import { CheckInService } from './check-in/check-in.service';
import { StatisticsController } from './statistics/statistics.controller';
import { StatisticsService } from './statistics/statistics.service';
import { ScannerController } from './scanner/scanner.controller';
import { ScannerService } from './scanner/scanner.service';
import { AttendanceService } from './attendance/attendance.service';
import { XpSettingsController } from './xp-settings/xp-settings.controller';
import { AdminHistoryController } from './history/admin-history.controller';

@Module({
  imports: [TelegramModule, QrModule, RegistrationsModule, ProgressionModule],
  controllers: [
    DashboardController,
    AdminPlayersController,
    AdminTournamentsController,
    CheckInController,
    StatisticsController,
    ScannerController,
    XpSettingsController,
    AdminHistoryController,
  ],
  providers: [
    DashboardService,
    AdminPlayersService,
    AdminTournamentsService,
    CheckInService,
    StatisticsService,
    ScannerService,
    AttendanceService,
  ],
})
export class AdminModule {}
