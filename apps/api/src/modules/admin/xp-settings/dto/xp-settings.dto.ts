import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { XpSettingKey } from '@prisma/client';

export class XpSettingEntryDto {
  @ApiProperty({ enum: XpSettingKey })
  @IsEnum(XpSettingKey)
  key!: XpSettingKey;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  value!: number;
}

export class UpdateXpSettingsDto {
  @ApiProperty({ type: [XpSettingEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => XpSettingEntryDto)
  settings!: XpSettingEntryDto[];
}

export class LevelThresholdEntryDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  level!: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  requiredXp!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  title?: string;
}

export class UpdateLevelsDto {
  @ApiProperty({ type: [LevelThresholdEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LevelThresholdEntryDto)
  levels!: LevelThresholdEntryDto[];
}
