import { Controller, Delete, Get, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AtGuard } from 'src/auth/decorator';
import { ObjectId } from 'mongodb';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('me')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my subscription' })
  @ApiOkResponse({
    description: 'Successfully retrieved subscription',
    type: 'object',
  })
  async getMySubscription(@Req() req: any) {
    return this.subscriptionService.getSubscription({
      'user._id': new ObjectId(req.user._id),
    } as any);
  }

  @Delete('cancel')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel my subscription' })
  @ApiOkResponse({
    description: 'Successfully canceled subscription',
    type: 'object',
  })
  async cancelMySubscription(@Req() req: any) {
    return this.subscriptionService.cancelSubscription(
      new ObjectId(req.user._id) as any,
    );
  }
}
