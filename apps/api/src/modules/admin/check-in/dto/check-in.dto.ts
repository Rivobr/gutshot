import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckInDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;
}
