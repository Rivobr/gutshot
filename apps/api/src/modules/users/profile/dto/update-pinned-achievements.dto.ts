import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString, MaxLength } from 'class-validator';
import { MAX_PINNED_ACHIEVEMENTS } from '../profile.service';

export class UpdatePinnedAchievementsDto {
  @ApiProperty({
    description: 'Идентификаторы достижений, закреплённых в профиле',
    type: [String],
    maxItems: MAX_PINNED_ACHIEVEMENTS,
  })
  @IsArray()
  @ArrayMaxSize(MAX_PINNED_ACHIEVEMENTS)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  achievementIds!: string[];
}
