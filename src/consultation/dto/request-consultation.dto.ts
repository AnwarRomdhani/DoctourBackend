import { IsInt, IsDateString } from 'class-validator';

export class RequestConsultationDto {
  @IsInt()
  doctorId: number;

  @IsDateString()
  scheduledAt: string;
}
