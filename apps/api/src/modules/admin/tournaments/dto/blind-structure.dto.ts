import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class BlindLevelDto {
  @ApiPropertyOptional({ description: 'Перерыв вместо игрового уровня' })
  @IsOptional()
  @IsBoolean()
  isBreak?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  smallBlind?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bigBlind?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ante?: number;

  @ApiProperty({ description: 'Длительность уровня в секундах' })
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(4 * 3600)
  durationSec!: number;
}

export class UpdateBlindStructureDto {
  @ApiProperty({ type: [BlindLevelDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => BlindLevelDto)
  levels!: BlindLevelDto[];
}

export class ClockActionDto {
  @ApiPropertyOptional({ description: 'Индекс уровня для перехода (0-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  levelIdx?: number;

  @ApiPropertyOptional({ description: 'Игроков за столами (перебивает авторасчёт)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  playersIn?: number;
}
