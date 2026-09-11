import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleHomePageDto {
  @ApiProperty({
    description: 'Whether the document should be featured on the homepage (max 4)',
    type: Boolean,
    example: true,
  })
  @IsBoolean()
  isHomePage: boolean;
}
