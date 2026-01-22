import { Controller,Post,Patch,Body,Req,UseGuards, Param } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { ScheduleConsultationDto } from './dto/schedule-consultation.dto';
import { UpdateConsultationStatusDto } from './dto/update-status.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestConsultationDto } from './dto/request-consultation.dto';    
import { ApproveConsultationDto } from './dto/approve-consultation.dto';
import { ForbiddenException } from '@nestjs/common';

@Controller('consultation')
@UseGuards(JwtAuthGuard)
export class ConsultationController {
    constructor(private consultationService:ConsultationService) {}


    @Post('schedule')
    schedule(@Body()dto: ScheduleConsultationDto,@Req() req ){
        if (req.user.role !== 'PATIENT') {
            throw new Error('Only patients can schedule consultations');
        }

        return this.consultationService.scheduleConsultation({
            ...dto,
            patientId: req.user.id,
        });
    }

    @Patch('status')
    updateStatus(@Body() dto:UpdateConsultationStatusDto,@Req() req){
        if (req.user.role !== 'DOCTOR') {
            throw new Error('Only doctors can update consultation status');
        }

        return this.consultationService.updateStatus(dto);
    }


    @Post('message')
    sendMessage(@Body() dto:SendMessageDto,@Req() req){
        const senderId = req.user.id;
        return this.consultationService.sendMessage(
            dto,
            senderId
        );
    }

    @Patch('cancel/:id')
    cancelConsultation(@Req() req,@Param('id') consultationId: number) {
        if (req.user.role !== 'PATIENT') {
            throw new Error('Only patients can cancel consultations');
        }
        
        return this.consultationService.cancelConsultation(Number(consultationId), req.user.id);
    }


    @Post('request')
  requestConsultation(@Body() dto: RequestConsultationDto, @Req() req) {
    if (req.user.role !== 'PATIENT') {
      throw new ForbiddenException('Only patients can request consultations');
    }

    return this.consultationService.requestConsultation({
      patientId: req.user.id,
      doctorId: dto.doctorId,
      scheduledAt: dto.scheduledAt,
    });
  }

  @Patch('approve')
  approveConsultation(@Body() dto: ApproveConsultationDto, @Req() req) {
    if (req.user.role !== 'DOCTOR') {
      throw new ForbiddenException('Only doctors can approve consultations');
    }

    return this.consultationService.approveConsultation(
      dto.consultationId,
      req.user.id,
    );
  }

  @Patch('start/:id')
startConsultation(@Param('id') id: string, @Req() req) {
  if (req.user.role !== 'DOCTOR') {
    throw new ForbiddenException('Only doctors can start consultations');
  }

  return this.consultationService.startConsultation(
    Number(id),
    req.user.id,
  );
}
@Patch('end/:id')
endConsultation(@Param('id') id: string, @Req() req) {
  if (req.user.role !== 'DOCTOR') {
    throw new ForbiddenException('Only doctors can end consultations');
  }

  return this.consultationService.endConsultation(
    Number(id),
    req.user.id,
  );
}



}
