import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';

@Module({
  controllers: [PatientController],
  providers: [PatientService,PrismaService],
})
export class PatientModule {}
