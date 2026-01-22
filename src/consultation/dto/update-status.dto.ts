import {IsEnum,IsInt,IsNotEmpty} from 'class-validator';
import { ConsultationStatus } from '@prisma/client';

export class UpdateConsultationStatusDto {
    @IsInt()
    @IsNotEmpty()
    consultationId: number;
    
    @IsEnum(ConsultationStatus)
    @IsNotEmpty()
    status: ConsultationStatus;
}