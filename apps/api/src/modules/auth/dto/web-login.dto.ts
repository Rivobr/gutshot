import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** Логин = ник, почта или телефон. */
export class WebLoginDto {
  @ApiProperty({ example: 'Mila_Ace | you@mail.ru | +79990091199' })
  @IsString()
  @IsNotEmpty()
  login!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}
