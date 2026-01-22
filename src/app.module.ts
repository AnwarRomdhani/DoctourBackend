import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PatientModule } from './patient/patient.module';
import { DoctorModule } from './doctor/doctor.module';
import { AuthModule } from './auth/auth.module';
import { ConsultationModule } from './consultation/consultation.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule'

@Module({
  imports: [PrismaModule,
      ScheduleModule.forRoot(),
     PatientModule,
      DoctorModule,
       AuthModule, 
       ConsultationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
