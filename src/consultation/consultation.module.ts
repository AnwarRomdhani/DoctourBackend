import { Module } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { ConsultationController } from './consultation.controller';
import { ConsultationCron } from './consultation.cron';

@Module({
  providers: [ConsultationService, ConsultationCron],
  controllers: [ConsultationController]
})
export class ConsultationModule {}
