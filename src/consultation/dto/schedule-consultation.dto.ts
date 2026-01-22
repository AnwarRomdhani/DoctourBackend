import { IsInt, IsNotEmpty, IsDateString } from 'class-validator';

export class ScheduleConsultationDto {
    @IsInt()
    @IsNotEmpty()
    patientId: number;

    @IsInt()
    @IsNotEmpty()
    doctorId: number;
    
    @IsDateString()
    @IsNotEmpty()
    scheduledAt: string;
}