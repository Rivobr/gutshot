import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpsertAchievementTextDto {
  @ApiProperty({ maxLength: 16, example: '🏆' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  icon!: string;

  @ApiProperty({ maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  title!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ description: 'Инструкция «Как получить»', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  howTo!: string;
}
