import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { AtGuard, AdminAtGuard, CurrentUser } from 'src/auth/decorator';
import { CreateReportInput } from './dto';
import { ReportService } from './report.service';

@ApiTags('Reports')
@Controller()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('reports')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a report for a document' })
  async createReport(@CurrentUser() user: any, @Body() dto: CreateReportInput) {
    return this.reportService.createReport(user._id.toString(), dto);
  }

  @Get('admin/reports')
  @AdminAtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all reports for admin review' })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    example: 'pending',
    description: 'Optional report status filter',
  })
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
    example: 20,
    description: 'Defaults to 20',
  })
  async getAllReports(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const result = await this.reportService.getAllReports(
      { status },
      { page, limit },
    );

    return {
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  @Patch('admin/reports/:id/status')
  @AdminAtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a report status' })
  async updateReportStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.reportService.updateReportStatus(
      id,
      status,
      user._id.toString(),
    );
  }
}
