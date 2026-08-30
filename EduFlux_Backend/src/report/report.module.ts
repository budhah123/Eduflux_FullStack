import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportEntity } from './entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { DocumentEntity } from 'src/documents/entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportEntity, DocumentEntity]),
    AuditLogModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
