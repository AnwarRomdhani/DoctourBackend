import { Controller,Post,Body, Get, Patch, Param, Delete } from '@nestjs/common';
import {PatientService} from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Controller('patient')
export class PatientController {
    constructor(private patientService: PatientService) {}

    @Post('register')
    create(@Body() data:CreatePatientDto){
        return this.patientService.createPatient(data);
    }

    @Get()
    findAll(){
        return this.patientService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string){
        return this.patientService.findOne(Number(id));  
    }
    
    @Patch(':id')
    update(@Param('id') id:string, @Body() data:any){
        return this.patientService.updatePatient(Number(id), data);
    }

    @Delete(':id')
    remove(@Param('id') id:string){
        return this.patientService.deletePatient(Number(id));
    }

}
