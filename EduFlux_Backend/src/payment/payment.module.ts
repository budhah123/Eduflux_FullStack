import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentEntity } from './entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsModule } from 'src/documents';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity]), DocumentsModule],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
