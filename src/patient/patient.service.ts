import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreatePatientDto } from './dto/create-patient.dto';


@Injectable()
export class PatientService {
    constructor(private prisma: PrismaService) {}
    
    async getAllPatients() {
        return this.prisma.patient.findMany();
    }
    async createPatient(data: CreatePatientDto) {
        if (data.cin && !/^\d{8}$/.test(data.cin)) {
                 throw new BadRequestException('CIN must be exactly 8 digits');
             }
         const hashedPassword = await bcrypt.hash(data.password, 10);
        try{
        const user = await this.prisma.user.create({
            data: {
                ...data,
                password:hashedPassword,
                role:'PATIENT',
            },
        });
        const patient = await this.prisma.patient.create({
            data: {
                userId: user.id,
            },
        });
        return {user, patient};
    }catch(error){
         if (error.code === 'P2002') {
            const field = error.meta?.target?.[0];

            if (field === 'phoneNumber') {
                throw new BadRequestException('This phone number is already registered');
            }

            if (field === 'email') {
                throw new BadRequestException('This email is already registered');
            }
            


               throw new BadRequestException(`Duplicate value for field: ${field}`);
        }

        // Re-throw unchanged error if it's not a known Prisma error
        throw error;
    }
}
          
    async findAll() {
        return this.prisma.patient.findMany({
            include: {
                user: true,
            },
        });
    }  
    async findOne(patientId: number) {
        return this.prisma.patient.findUnique({
            where: { userId: patientId },
            include: {
                user: true,
            },
        });
    }
    async updatePatient(patientId: number, data: Partial<{firstName: string; lastName: string; address: string}>) {
        return this.prisma.user.update({
            where: { id: patientId },
            data,
        });
    }
    async deletePatient(patientId: number) {
        await this.prisma.patient.delete({ where: { userId: patientId } });
        return this.prisma.user.delete({ where: { id: patientId } });
    } 
}
