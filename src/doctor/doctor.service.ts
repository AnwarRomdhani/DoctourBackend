import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';

@Injectable()
export class DoctorService {
    constructor(private prisma: PrismaService) {}

    async getAllDoctors() {
        return this.prisma.doctor.findMany({
            include: {
                user: true,
            },
        });
    }

    async createDoctor(data: CreateDoctorDto) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
                role: 'DOCTOR',
            },
        });
        try {
            const doctor = await this.prisma.doctor.create({
                data: {
                    userId: user.id,
                },
            });
            return { user, doctor };    
        }catch(error){
                if (error.code === 'P2002') {
                const field = error.meta?.target?.[0];  
                if (field === 'cnom') {
                    throw new BadRequestException('This CNOM is already registered');
                }
                if (field === 'phoneNumber') {
                    throw new BadRequestException('This phone number is already registered');
                }
                if (field === 'email') {
                    throw new BadRequestException('This email is already registered');
                }
                throw new BadRequestException(`Duplicate value for field: ${field}`);
            }
            throw error;
        }
    }
    async findone(Doctorid: number) {
        return this.prisma.doctor.findUnique({
            where: { userId : Doctorid},
            include: {
                user: true,
            },
        });
    }   
    async updateDoctor(Doctorid: number, data:Partial<{firstName: string; lastName: string; address: string}>) {
        return this.prisma.user.update({
            where: { id: Doctorid },
            data,
        });
    }
    async deleteDoctor(Doctorid: number) {
        await this.prisma.doctor.delete({
            where: { userId: Doctorid },
        });
       return this.prisma.user.delete({ where: { id: Doctorid } });

    }

}
