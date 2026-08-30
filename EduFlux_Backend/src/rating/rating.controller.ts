import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AtGuard, CurrentUser } from 'src/auth/decorator';
import { CreateRatingInput } from './dto';
import { RatingService } from './rating.service';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create or update a user rating for a document' })
  async createRating(@CurrentUser() user: any, @Body() dto: CreateRatingInput) {
    return this.ratingService.createOrUpdateRating(user._id.toString(), dto);
  }

  @Get('document/:documentId')
  @ApiOperation({ summary: 'Get paginated ratings for a document' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Defaults to 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Defaults to 10',
  })
  async getRatingsForDocument(
    @Param('documentId') documentId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.ratingService.getRatingsForDocument(documentId, {
      page,
      limit,
    });

    return {
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
      average: result.average,
      count: result.count,
    };
  }

  @Delete(':id')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a rating (author or admin)' })
  async deleteRating(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ratingService.deleteRating(user._id.toString(), id);
  }
}
