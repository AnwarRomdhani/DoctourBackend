import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SYSTEM_USER_ID } from 'src/common/constants';

@Injectable()
export class ConsultationCron {
    private readonly logger = new Logger(ConsultationCron.name);

    constructor(private prisma: PrismaService) {}

    @Cron('*/1 * * * *')
    async handleNoShowConsultations() {
        const graceMinutes = 15;
        const cutoff= new Date(Date.now() - graceMinutes * 60 * 1000);

        const consultations = await this.prisma.consultation.findMany({
            where: {
                status: 'RESERVED',
                scheduledAt: { lt: cutoff },
            },
        });

        for (const consultation of consultations) {
            try {
                await this.handleNoShow(consultation.id);
            }catch (error) {
                this.logger.error(`Failed to process consultation ID ${consultation.id}: ${error.message}`);
            }
        }
    }

 private async handleNoShow(consultationId: number) {
    await this.prisma.$transaction(async (tx) => {
        const consultation = await tx.consultation.findUnique({
            where: { id: consultationId },
        });

        if (!consultation || consultation.status !== 'RESERVED') return;

        const price = consultation.priceCoins;

        const patientRefund = +(price * 0.5).toFixed(2);
        const doctorGross = +(price * 0.5).toFixed(2);
        const systemCut = +(doctorGross * 0.02).toFixed(2);
        const doctorNet = +(doctorGross - systemCut).toFixed(2);

        await tx.user.update({
            where: { id: consultation.patientId },
            data: {
                lockedCoins: { decrement: price },
                coinBalance: { increment: patientRefund },
            },
        });

        await tx.user.update({
            where: { id: consultation.doctorId },
            data: {
                coinBalance: { increment: doctorNet },
            },
        });


        await tx.user.update({
            where: { id: SYSTEM_USER_ID },
            data: {
                coinBalance: { increment: systemCut },
            },
        });

        await tx.ledger.createMany({
            data: [
                {
                    fromUserId: consultation.patientId,
                    toUserId: consultation.patientId,
                    consultationId,
                    amount: patientRefund,
                    type: 'NO_SHOW_REFUND',
                },
                {
                    fromUserId: consultation.patientId,
                    toUserId: consultation.doctorId,
                    consultationId,
                    amount: doctorNet,
                    type: 'DOCTOR_EARNINGS',
                },
                {
                    fromUserId: consultation.patientId,
                    toUserId: SYSTEM_USER_ID,
                    consultationId,
                    amount: systemCut,
                    type: 'SYSTEM_CUT',
                },
            ],
        });

        await tx.consultation.update({
            where: { id: consultationId },
            data: { status: 'NO_SHOW' },
        });
    });
}


}

