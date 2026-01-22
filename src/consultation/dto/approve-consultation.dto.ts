import { IsInt } from 'class-validator';

export class ApproveConsultationDto {
  @IsInt()
  consultationId: number;
}
