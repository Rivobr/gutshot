import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class TournamentResultEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  registrationId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  place!: number;
}
