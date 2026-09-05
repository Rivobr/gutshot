import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateShiftEntryDto {
  @ApiProperty({ description: 'Имя сотрудника', example: 'Аня' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Дата смены (ISO, учитывается день)' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Сумма за день, ₽' })
  @IsInt()
  amount!: number;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateShiftEntryDto {
  @ApiPropertyOptional({ description: 'Имя сотрудника' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'Дата смены (ISO)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Сумма за день, ₽' })
  @IsOptional()
  @IsInt()
  amount?: number;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Месяц в формате YYYY-MM. По умолчанию — текущий месяц.',
    example: '2026-09',
  })
  @IsOptional()
  @IsString()
  month?: string;
}
