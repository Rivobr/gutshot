import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, ValidateIf } from 'class-validator';

export class SetPlaceDto {
  @ApiPropertyOptional({
    description: 'Место игрока. null — сбросить место (например, при ошибке или re-entry).',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  @IsOptional()
  place?: number | null;
}
