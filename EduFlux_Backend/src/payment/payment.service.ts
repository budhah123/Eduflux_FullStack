import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios'; // correct
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionEntity } from 'src/subscription/entity';
import { MongoRepository } from 'typeorm';
import { UserEntity } from 'src/user/entity';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { PaymentProvider } from 'src/subscription/enum/payment-provider.enum';
import { PlanType } from 'src/subscription/enum/plan-type.enum';
import { SubscriptionStatus } from 'src/subscription/enum/subscription-status.enum';

@Injectable()
export class PaymentService {
  constructor(
    private http: HttpService,
    @InjectRepository(SubscriptionEntity)
    private subscriptionRepository: MongoRepository<SubscriptionEntity>,
    @InjectRepository(UserEntity)
    private userRepository: MongoRepository<UserEntity>,
  ) {}

  // ================= INITIATE =================

  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    if (dto.provider === PaymentProvider.KHALTI)
      return this.initiateKhaltiPayment(userId, dto);

    if (dto.provider === PaymentProvider.ESEWA)
      return this.initiateEsewaPayment(userId, dto);

    throw new Error('Invalid payment provider');
  }

  private async initiateKhaltiPayment(userId: string, dto: InitiatePaymentDto) {
    const payload = {
      return_url: `${process.env.FRONTEND_URL}/subscription/khalti/callback`,
      website_url: process.env.FRONTEND_URL,
      amount: dto.amount * 100, // paisa
      purchase_order_id: `${userId}-${Date.now()}`,
      purchase_order_name: `Eduflux ${dto.planType} subscription`,
    };

    const res: AxiosResponse<any> = await firstValueFrom(
      this.http.post(
        'https://a.khalti.com/api/v2/epayment/initiate/',
        payload,
        { headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` } },
      ),
    );

    return res.data; // { pidx, payment_url }
  }

  private async initiateEsewaPayment(userId: string, dto: InitiatePaymentDto) {
    const transactionUuid = `${userId}-${Date.now()}`;
    const totalAmount = dto.amount;

    const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${process.env.ESEWA_MERCHANT_CODE}`;
    const signature = crypto
      .createHmac('sha256', `${process.env.ESEWA_SECRET_KEY}`)
      .update(signatureString)
      .digest('base64');

    return {
      formUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
      fields: {
        amount: totalAmount,
        tax_amount: 0,
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: process.env.ESEWA_MERCHANT_CODE,
        product_service_charge: 0,
        product_delivery_charge: 0,
        success_url: `${process.env.FRONTEND_URL}/subscription/esewa/callback`,
        failure_url: `${process.env.FRONTEND_URL}/subscription/failed`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature,
      },
    };
  }

  // ================= VERIFY =================
  async verifyPayment(userId: string, dto: VerifyPaymentDto): Promise<boolean> {
    if (dto.provider === PaymentProvider.KHALTI) return this.verifyKhalti(dto);
    if (dto.provider === PaymentProvider.ESEWA) return this.verifyEsewa(dto);
    throw new BadRequestException('Unsupported payment provider');
  }

  private async verifyKhalti(dto: VerifyPaymentDto): Promise<boolean> {
    const res: AxiosResponse<any> = await firstValueFrom(
      this.http.post(
        `${process.env.KHALTI_VERIFY_URL}`,
        { pidx: dto.pidx },
        { headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` } },
      ),
    );
    return res.data.status === 'Completed';
  }

  private async verifyEsewa(dto: VerifyPaymentDto): Promise<boolean> {
    const res: AxiosResponse<any> = await firstValueFrom(
      this.http.get(`${process.env.ESEWA_VERIFY_URL}`, {
        params: {
          product_code: process.env.ESEWA_MERCHANT_CODE,
          transaction_uuid: dto.transactionUuid,
          total_amount: dto.amount,
        },
      }),
    );
    return res.data.status === 'COMPLETE';
  }

  // ================= ACTIVATE SUBSCRIPTION =================
  async activateSubscription(userId: string, dto: VerifyPaymentDto) {
    const user = await this.userRepository.findOne({
      where: { _id: new ObjectId(userId) },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let sub = await this.subscriptionRepository.findOne({
      where: { userId: new ObjectId(userId) },
    });

    const expiry = new Date();
    if (dto.planType === PlanType.YEARLY)
      expiry.setFullYear(expiry.getFullYear() + 1);
    else expiry.setMonth(expiry.getMonth() + 1);

    if (!sub) {
      sub = this.subscriptionRepository.create({
        user,
      } as Partial<SubscriptionEntity>);
    }

    sub.status = SubscriptionStatus.ACTIVE;
    sub.planType = dto.planType;
    sub.expiryDate = expiry;
    sub.paymentProvider = dto.provider;
    sub.transactionId = dto.pidx ?? dto.transactionUuid;

    return this.subscriptionRepository.save(sub);
  }
}
