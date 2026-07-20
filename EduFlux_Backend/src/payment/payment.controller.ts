// src/payment/payment.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto';
import { AtGuard } from 'src/auth/decorator';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('initiate')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initiate payment via Khalti or eSewa' })
  async initiate(@Body() dto: InitiatePaymentDto, @Req() req) {
    const userId = req.user._id.toString();
    return this.paymentService.initiatePayment(userId, dto);
  }

  @Post('verify')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  async verify(@Body() dto: VerifyPaymentDto, @Req() req) {
    const userId = req.user._id.toString();

    const isValid = await this.paymentService.verifyPayment(userId, dto); // pass both args

    if (!isValid) {
      throw new BadRequestException('Payment verification failed');
    }

    const subscription = await this.paymentService.activateSubscription(
      userId,
      dto,
    );

    return {
      success: true,
      message: 'Payment verified, subscription activated',
      subscription,
    };
  }
}
