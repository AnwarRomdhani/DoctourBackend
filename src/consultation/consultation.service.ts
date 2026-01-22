import { Injectable,BadRequestException,NotFoundException,ForbiddenException } from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {ScheduleConsultationDto} from './dto/schedule-consultation.dto';
import {UpdateConsultationStatusDto} from './dto/update-status.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConsultationEntity } from './entities/consultation.entity';
import { Message }  from './entities/message.entity';
import { SYSTEM_USER_ID } from '../common/constants';



@Injectable()
export class ConsultationService {
    constructor(private prisma:PrismaService) {}

    
    async updateStatus(dto:UpdateConsultationStatusDto):Promise<ConsultationEntity> {
        const {consultationId,status} = dto;

        const consultation= await this.prisma.consultation.findUnique({where:{id:consultationId}});
        if (!consultation) throw new NotFoundException('Consultation not found');

        const updated= await this.prisma.consultation.update({
            where:{id:consultationId},
            data:{status}
        });
        
        return new ConsultationEntity(updated);
    }


   async sendMessage(
  dto: SendMessageDto,
  senderId: number,
): Promise<Message> {
  const { consultationId, content } = dto;

  const consultation = await this.prisma.consultation.findUnique({
    where: { id: consultationId },
  });

  if (!consultation) {
    throw new NotFoundException('Consultation not found');
  }

  // Must be participant
  if (
    consultation.patientId !== senderId &&
    consultation.doctorId !== senderId
  ) {
    throw new ForbiddenException('You are not part of this consultation');
  }

  // 🔒 Must be ACTIVE
  if (consultation.status !== 'ACTIVE') {
    throw new BadRequestException(
      'Messages can only be sent during an active consultation',
    );
  }

  const message = await this.prisma.message.create({
    data: {
      consultationId,
      senderId,
      content,
    },
  });

  return new Message(message);
}



    async cancelConsultation(consultationId: number, patientId: number) {
  const consultation = await this.prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!consultation) throw new NotFoundException('Consultation not found');
  if (consultation.patientId !== patientId) throw new ForbiddenException('You can only cancel your own consultations');
  if (consultation.status !== 'RESERVED') throw new BadRequestException('Only RESERVED consultations can be cancelled');

  const hoursBefore = (consultation.scheduledAt.getTime() - new Date().getTime()) / (1000 * 60 * 60);
  const price = consultation.priceCoins;

  return this.prisma.$transaction(async (tx) => {
    if (hoursBefore >= 3) {
      // Full refund
      await tx.user.update({
        where: { id: patientId },
        data: {
          coinBalance: { increment: price },
          lockedCoins: { decrement: price },
        },
      });

      // Ledger entry
      await tx.ledger.create({
        data: {
          fromUserId: consultation.doctorId, // optional, or null
          toUserId: patientId,
          amount: price,
          type: "REFUND",
          consultationId,
        },
      });

    } else {
      // 50/50 split
      const halfPrice = +(price / 2).toFixed(2);
      const doctorAmount = +(price - halfPrice).toFixed(2);
      const systemCut = +(doctorAmount * 0.02).toFixed(2);
      const doctorReceives = +(doctorAmount - systemCut).toFixed(2);

      // Update balances
      await tx.user.update({
        where: { id: patientId },
        data: {
          coinBalance: { increment: halfPrice },
          lockedCoins: { decrement: price },
        },
      });

      await tx.user.update({
        where: { id: consultation.doctorId },
        data: {
          coinBalance: { increment: doctorReceives },
        },
      });

      await tx.user.update({
        where: { id: SYSTEM_USER_ID },
        data: {
          coinBalance: { increment: systemCut },
        },
      });

      // Ledger entries
      await tx.ledger.createMany({
        data: [
          {
            fromUserId: consultation.doctorId,
            toUserId: patientId,
            amount: halfPrice,
            type: "LATE_CANCEL",
            consultationId,
          },
          {
            fromUserId: patientId,
            toUserId: consultation.doctorId,
            amount: doctorReceives,
            type: "DOCTOR_EARNINGS",
            consultationId,
          },
          {
            fromUserId: consultation.doctorId,
            toUserId: SYSTEM_USER_ID,
            amount: systemCut,
            type: "SYSTEM_CUT",
            consultationId,
          },
        ],
      });
    }

    return tx.consultation.update({
      where: { id: consultationId },
      data: { status: 'CANCELLED' },
    });
  });
}


  /* SCHEDULING & REQUESTING & RESERVING */

async requestConsultation(dto: ScheduleConsultationDto): Promise<ConsultationEntity> {
    const { patientId, doctorId, scheduledAt } = dto;

    const patient = await this.prisma.user.findUnique({ where: { id: patientId } });
    const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorId } });

    if (!patient) throw new NotFoundException('Patient not found');
    if (!doctor) throw new NotFoundException('Doctor not found');

    return new ConsultationEntity(
        await this.prisma.consultation.create({
            data: {
                patientId,
                doctorId,
                scheduledAt: new Date(scheduledAt),
                status: 'REQUESTED',
                priceCoins: doctor.consultationPrice,
            },
        }),
    );
}

async approveConsultation(consultationId: number, doctorId: number) {
    const consultation = await this.prisma.consultation.findUnique({
        where: { id: consultationId },
    });

    if (!consultation) throw new NotFoundException('Consultation not found');
    if (consultation.doctorId !== doctorId) {
        throw new ForbiddenException('Not your consultation');
    }

    if (consultation.status !== 'REQUESTED') {
        throw new BadRequestException('Only REQUESTED consultations can be approved');
    }

    const patient = await this.prisma.user.findUnique({
        where: { id: consultation.patientId },
    });

    if (!patient || patient.coinBalance < consultation.priceCoins) {
        throw new BadRequestException('Patient has insufficient balance');
    }

    return this.prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: consultation.patientId },
            data: {
                coinBalance: { decrement: consultation.priceCoins },
                lockedCoins: { increment: consultation.priceCoins },
            },
        });

        return tx.consultation.update({
            where: { id: consultationId },
            data: { status: 'RESERVED' },
        });
    });
}
async scheduleConsultation(dto:ScheduleConsultationDto):Promise<ConsultationEntity> {
        const {patientId,doctorId,scheduledAt} = dto;

        const patient = await this.prisma.user.findUnique({where:{id:patientId} })
        const doctor = await this.prisma.doctor.findUnique({where:{userId:doctorId} })

        if (!patient) throw new NotFoundException('Patient not found');
        if (!doctor) throw new NotFoundException('Doctor not found');

        const price = doctor.consultationPrice

        if (patient.coinBalance < price) {
            throw new BadRequestException('Insufficient coin balance');
        }

        const consultation = await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: patientId },
                data: {
                    coinBalance: { decrement: price },
                    lockedCoins: { increment: price },
                },
            });

            const newConsultation = await tx.consultation.create({
                data: {
                    patientId,
                    doctorId,
                    scheduledAt: new Date(scheduledAt),
                    status: 'RESERVED',
                    priceCoins: price,
                },
            });
            return newConsultation;
        })

        return new ConsultationEntity(consultation);
    }

    async startConsultation(
  consultationId: number,
  doctorId: number,
): Promise<ConsultationEntity> {
  return this.prisma.$transaction(async (tx) => {
    const consultation = await tx.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    if (consultation.doctorId !== doctorId) {
      throw new ForbiddenException('You are not assigned to this consultation');
    }

    if (consultation.status !== 'RESERVED') {
      throw new BadRequestException(
        'Only RESERVED consultations can be started',
      );
    }

    const price = consultation.priceCoins;
    const systemCut = +(price * 0.02).toFixed(2);
    const doctorEarnings = +(price - systemCut).toFixed(2);

    // 1️⃣ Patient: unlock locked coins
    await tx.user.update({
      where: { id: consultation.patientId },
      data: {
        lockedCoins: { decrement: price },
      },
    });

    // 2️⃣ Doctor gets paid
    await tx.user.update({
      where: { id: consultation.doctorId },
      data: {
        coinBalance: { increment: doctorEarnings },
      },
    });

    // 3️⃣ System gets cut
    await tx.user.update({
      where: { id: SYSTEM_USER_ID },
      data: {
        coinBalance: { increment: systemCut },
      },
    });

    // 4️⃣ Ledger entries
    await tx.ledger.createMany({
      data: [
        {
          type: 'DOCTOR_EARNINGS',
          amount: doctorEarnings,
          fromUserId: consultation.patientId,
          toUserId: consultation.doctorId,
          consultationId,
        },
        {
          type: 'SYSTEM_CUT',
          amount: systemCut,
          fromUserId: consultation.patientId,
          toUserId: SYSTEM_USER_ID,
          consultationId,
        },
      ],
    });

    // 5️⃣ Activate consultation
    const updated = await tx.consultation.update({
      where: { id: consultationId },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
      },
    });

    return new ConsultationEntity(updated);
  });
}

async endConsultation(
  consultationId: number,
  doctorId: number,
): Promise<ConsultationEntity> {
  const consultation = await this.prisma.consultation.findUnique({
    where: { id: consultationId },
  });

  if (!consultation) {
    throw new NotFoundException('Consultation not found');
  }

  if (consultation.doctorId !== doctorId) {
    throw new ForbiddenException('You are not assigned to this consultation');
  }

  if (consultation.status !== 'ACTIVE') {
    throw new BadRequestException(
      'Only ACTIVE consultations can be completed',
    );
  }

  const updated = await this.prisma.consultation.update({
    where: { id: consultationId },
    data: {
      status: 'COMPLETED',
      endedAt: new Date(),
    },
  });

  return new ConsultationEntity(updated);
}



}
