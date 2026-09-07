import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAtGuard } from 'src/auth/decorator';
import { AdminService } from './admin.service';

@AdminAtGuard()
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@ApiTags('Admin Dashboard')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get comprehensive dynamic admin dashboard statistics',
  })
  async getStats() {
    return this.adminService.getComprehensiveDashboardStats();
  }
}
