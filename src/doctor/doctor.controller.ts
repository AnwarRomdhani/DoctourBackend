import { Controller,Post,Get,Body,Patch,Param,Delete } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
@Controller('doctor')
export class DoctorController {
    constructor(private doctorService: DoctorService) {}
    
    @Post('register')
    create(@Body() data:CreateDoctorDto){
        return this.doctorService.createDoctor(data);
    }
    @Get()
    findAll(){
        return this.doctorService.getAllDoctors();
    }
    @Get(':id')
    findOne(@Param('id') id:string){
        return this.doctorService.findone(Number(id));
    }
     @Patch(':id')
        update(@Param('id') id: string, @Body() data: Partial<{ firstName: string; lastName: string; address: string }>) {
        return this.doctorService.updateDoctor(Number(id), data);
    }

    @Delete(':id')
    remove(@Param('id') id:string){
        return this.doctorService.deleteDoctor(Number(id));
    }
}
