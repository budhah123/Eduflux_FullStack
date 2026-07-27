import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AtGuard } from 'src/auth/decorator';
import { NotificationOutput } from './dto/notification.output';
import { PaginationInput } from 'src/common/pagination';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@AtGuard()
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the authenticated user' })
  @ApiOkResponse({
    description: 'List of notifications',
    type: [NotificationOutput],
  })
  async findMine(
    @Req() req,
    @Query() paginationInput: PaginationInput,
  ): Promise<NotificationOutput> {
    const [notifications, count] =
      await this.notificationService.getNotifications({
        userId: req.user._id.toString(),
      });
    return {
      data: notifications,
      meta: {
        total: count,
        page: paginationInput?.page ?? 1,
        limit: paginationInput?.limit ?? 10,
      },
    };
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count for the authenticated user',
  })
  @ApiOkResponse({
    description: 'Unread notification count',
    type: 'number',
  })
  async getUnreadCount(@Req() req) {
    const count = await this.notificationService.getUnreadCount(
      req.user._id.toString(),
    );
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark a notification as read',
  })
  async markAsRead(@Param('id') id: string, @Req() req) {
    return await this.notificationService.markAsRead(
      id,
      req.user._id.toString(),
    );
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read for the authenticated user',
  })
  async markAllAsRead(@Req() req) {
    return await this.notificationService.markAllAsRead(
      req.user._id.toString(),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async delete(@Param('id') id: string, @Req() req) {
    const result = await this.notificationService.deleteNotification(
      id,
      req.user._id.toString(),
    );

    if (!result) {
      // ← add this check first
      return {
        message: `Notification with ${id} not found or already deleted`,
      };
    }

    if (result.affected === 1) {
      return {
        message: `Notification with ${id} deleted successfully`,
      };
    }

    return {
      message: `Notification with ${id} could not be deleted`,
    };
  }
}
