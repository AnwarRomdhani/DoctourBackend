import { ConsultationStatus } from "@prisma/client";
import { Message } from "./message.entity";

export class ConsultationEntity {
    id: number;
    patientId: number;
    doctorId: number;
    scheduledAt: Date;
    startedAt: Date | null;
    endedAt: Date | null;
    status: ConsultationStatus;
    priceCoins: number;
    messages?: Message[];
    createdAt: Date;

    constructor(partial: Partial<ConsultationEntity>) {
        Object.assign(this, partial);
    }
}