import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateTournamentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  buyIn!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  maxPlayers!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registrationOpen?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registrationClose?: string;
}
