import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  CreateCheckoutInput,
  ManualVerifyInput,
  VerifyPaymentInput,
  GenerateEsewaDataInput,
} from './dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout')
  @ApiOperation({
    summary: 'Create checkout session',
    description: 'Initiates payment with eSewa or Khalti',
  })
  @ApiBody({ type: CreateCheckoutInput })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created successfully',
  })
  async checkout(@Body() dto: CreateCheckoutInput) {
    return await this.paymentService.createCheckoutPayment(dto);
  }

  @Get('verify')
  @ApiOperation({
    summary: 'Verify payment',
    description: 'Verifies payment from eSewa or Khalti after redirect',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment verification result',
  })
  async verify(@Query() dto: VerifyPaymentInput) {
    return await this.paymentService.verifyPayment(dto);
  }

  @Post('manual-verify')
  @ApiOperation({
    summary: 'Manually verify payment (Testing Only)',
    description:
      'Marks a payment as completed without gateway verification. Use this for testing.',
  })
  @ApiBody({ type: ManualVerifyInput })
  @ApiResponse({
    status: 200,
    description: 'Payment manually verified',
  })
  async manualVerify(@Body() dto: ManualVerifyInput) {
    return await this.paymentService.manualVerify(dto);
  }

  @Post('generate-esewa-data')
  @ApiOperation({
    summary: 'Generate eSewa test data (Testing Only)',
    description:
      'Generates base64-encoded data and complete verify URL for testing eSewa payments.',
  })
  @ApiBody({ type: GenerateEsewaDataInput })
  @ApiResponse({
    status: 200,
    description: 'eSewa test data generated with verify URL',
  })
  async generateEsewaData(@Body() dto: GenerateEsewaDataInput) {
    return await this.paymentService.generateEsewaData(dto);
  }
}
