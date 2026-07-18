import {
  BadRequestException,
  Header,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentEntity } from './entity';
import { MongoRepository } from 'typeorm';
import { DocumentsService } from '../documents';
import {
  CreateCheckoutInput,
  ManualVerifyInput,
  VerifyPaymentInput,
  GenerateEsewaDataInput,
} from './dto';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { PaymentMethod, PaymentStatus } from './enum';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: MongoRepository<PaymentEntity>,
    private readonly documentsService: DocumentsService,
  ) {}

  async createCheckoutPayment(createCheckoutInput: CreateCheckoutInput) {
    const { method, assignmentId, amount } = createCheckoutInput;
    const assignment = await this.documentsService.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException(`File with ${assignmentId} nof found`);
    }

    const transactionUuid = `${Date.now()}-${uuidv4()}`;
    const payment = this.paymentRepository.create({
      ...createCheckoutInput,
      transactionUuid:
        method === PaymentMethod.ESWEA ? transactionUuid : undefined,
      assignment,
    });

    // Save payment to database to generate _id before using it in URLs
    await this.paymentRepository.save(payment);

    // =====================================ESEWA ====================================
    if (method === PaymentMethod.ESWEA) {
      const signatureString = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${process.env.ESEWA_MERCHANT_CODE}`;

      const signature = crypto
        .createHmac('sha256', process.env.ESEWA_SECRET_KEY!)
        .update(signatureString)
        .digest('base64');
      return {
        paymentId: payment._id,
        esewaConfig: {
          total_amount: amount,
          transaction_uuid: transactionUuid,
          product_code: process.env.ESEWA_MERCHANT_CODE,
          success_url: `${process.env.BASE_URL}/payment/verify?method=${PaymentMethod.ESWEA}&paymentId=${payment._id}`,
          failure_url: `${process.env.BASE_URL}`,
          signature,
        },
      };
    }

    // ==========Khalti============
    if (method === PaymentMethod.KHALTI) {
      const khaltiAmount = Math.round(amount * 100);

      const response = await fetch(
        'https://a.khalti.com/api/v2/epayment/initiate/',

        {
          method: 'POST',
          headers: {
            Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            return_url: `${process.env.BASE_URL}/payment/verify?method=${PaymentMethod.KHALTI}&paymentId=${payment._id}`,
            website_url: `${process.env.BASE_URL}`,
            amount: khaltiAmount,
            purchase_order_id: payment._id,
            purchase_order_title: assignment.title,
          }),
        },
      );
      if (!response.ok) {
        throw new BadRequestException('Khalti Initialization Failed');
      }
      const data = await response.json();
      return {
        paymentId: payment._id,
        khaltiPaymentUrl: data.payment_url,
      };
    }
    throw new BadRequestException('Invalid Payment Method');
  }

  // ==============================
  // VERIFY PAYMENT
  // ==============================
  async verifyPayment(verifyPaymentInput: VerifyPaymentInput) {
    const { method, paymentId, data, pidx } = verifyPaymentInput;
    const payment = await this.paymentRepository.findOne({
      where: { _id: new ObjectId(paymentId) },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ${paymentId} not found `);
    }

    // ==========ESEWA Verification================
    if (method === PaymentMethod.ESWEA && data) {
      const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));

      // TEST MODE: Skip external verification
      if (process.env.PAYMENT_TEST_MODE === 'true') {
        payment.paymentStatus = PaymentStatus.COMPLETED;
        const result = await this.paymentRepository.save(payment);
        return {
          message: 'Payment Successful (Test Mode)',
          result,
        };
      }

      const verifyUrl = `${process.env.ESEWA_VERIFY_URL}?product_code=${process.env.ESEWA_MERCHANT_CODE}&total_amount=${decoded.total_amount}&transaction_uuid=${decoded.transaction_uuid}`;

      const response = await fetch(verifyUrl);
      const verification = await response.json();

      if (verification.status === 'COMPLETE') {
        payment.paymentStatus = PaymentStatus.COMPLETED;
        const result = await this.paymentRepository.save(payment);
        return {
          message: 'Payment Successful',
          result,
        };
      }
      return {
        message: 'Payment Pending',
      };
    }

    // ========= Khalti Verification =========
    if (method === PaymentMethod.KHALTI && pidx) {
      // TEST MODE: Skip external verification
      if (process.env.PAYMENT_TEST_MODE === 'true') {
        payment.paymentStatus = PaymentStatus.COMPLETED;
        payment.khaltiPidix = pidx;
        await this.paymentRepository.save(payment);
        return {
          message: 'Payment Successful (Test Mode)',
        };
      }

      const response = await fetch(process.env.KHALTI_VERIFY_URL!, {
        method: 'POST',
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx }),
      });

      const result = await response.json();

      if (result.status === 'Completed') {
        payment.paymentStatus = PaymentStatus.COMPLETED;
        payment.khaltiPidix = pidx;
        await this.paymentRepository.save(payment);
        return {
          message: 'Payment Successful',
        };
      }
      return {
        message: 'Payment pending',
      };
    }
    throw new BadRequestException('Invalid verification request');
  }

  // ==============================
  // MANUAL VERIFY (For Testing)
  // ==============================
  async manualVerify(manualVerifyInput: ManualVerifyInput) {
    const { paymentId } = manualVerifyInput;

    const payment = await this.paymentRepository.findOne({
      where: { _id: new ObjectId(paymentId) },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ${paymentId} not found`);
    }

    if (payment.paymentStatus === PaymentStatus.COMPLETED) {
      return {
        message: 'Payment already completed',
        payment,
      };
    }

    payment.paymentStatus = PaymentStatus.COMPLETED;
    const result = await this.paymentRepository.save(payment);

    return {
      message: 'Payment manually verified and marked as completed',
      result,
    };
  }

  // ==============================
  // GENERATE ESEWA DATA (For Testing)
  // ==============================
  async generateEsewaData(generateEsewaDataInput: GenerateEsewaDataInput) {
    const { paymentId, transactionCode, status } = generateEsewaDataInput;

    const payment = await this.paymentRepository.findOne({
      where: { _id: new ObjectId(paymentId) },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ${paymentId} not found`);
    }

    if (payment.method !== PaymentMethod.ESWEA) {
      throw new BadRequestException(
        'This endpoint only works for eSewa payments',
      );
    }

    // Create the data object that eSewa would send
    const esewaData = {
      transaction_code: transactionCode || '0007KNH',
      status: status || 'COMPLETE',
      total_amount: payment.amount.toString(),
      transaction_uuid: payment.transactionUuid,
      product_code: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
      signed_field_names:
        'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names',
    };

    // Encode to base64
    const base64Data = Buffer.from(JSON.stringify(esewaData)).toString(
      'base64',
    );

    // Generate the complete verify URL
    const verifyUrl = `${process.env.BASE_URL}/payment/verify?method=ESWEA&paymentId=${paymentId}&data=${base64Data}`;

    return {
      message: 'eSewa test data generated successfully',
      esewaData,
      base64Data,
      verifyUrl,
    };
  }
}
