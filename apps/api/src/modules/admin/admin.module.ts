import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { QrModule } from '../qr/qr.module';
import { RegistrationsModule } from '../registrations/registrations.module';
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

@Module({
  imports: [TelegramModule, QrModule, RegistrationsModule],
  controllers: [
    DashboardController,
    AdminPlayersController,
    AdminTournamentsController,
    CheckInController,
    StatisticsController,
  ],
  providers: [
    DashboardService,
    AdminPlayersService,
    AdminTournamentsService,
    CheckInService,
    StatisticsService,
  ],
})
export class AdminModule {}
