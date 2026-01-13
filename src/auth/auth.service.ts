import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';  
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/Login.dto';
import { User } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
    constructor(
        private prisma:PrismaService,
        private jwtService:JwtService
    ){}

    async validateUser(dto:LoginDto):Promise<User | null>{
        const user=await this.prisma.user.findUnique({
            where:{email:dto.email}
        });
        if(!user){
            return null;
        }
        const isPasswordValid=await bcrypt.compare(dto.password,user.password);
        if(!isPasswordValid){
            return null;
        }
        return user;
    }

    async getTokens(userId:number,role:string){
        const payload={sub:userId,role};
         const access_token= this.jwtService.sign(payload,{
            expiresIn: '15m',
        }
    );
        const refresh_token= this.jwtService.sign(payload,{
            expiresIn: '7d',
        }

        );


        return {
            access_token,
            refresh_token,
        };

    }
    async loginWithDto(dto:LoginDto){
        const user=await this.validateUser(dto);
        if(!user){
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.is2FAEnabled){
            return {
                requires2FA: true,
                userId: user.id,
            };
        }

        const tokens=await this.getTokens(user.id,user.role);

        await this.updateRefreshToken(user.id,tokens.refresh_token);


        return {
            userId:user.id,
            role:user.role,
            ...tokens,
        }  
    }

     async updateRefreshToken(userId: number, refreshToken: string) {
        const hashed = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashed },
        });
    }

        async refreshTokens(userId: number, refreshToken: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Access Denied');
        }

        const rtMatches = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!rtMatches) throw new UnauthorizedException('Invalid refresh token');

        const tokens = await this.getTokens(user.id, user.role);

        await this.updateRefreshToken(user.id, tokens.refresh_token);

        return tokens;
    }


    async logout(userId: number) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }

    ///////////////// 2FA METHODS /////////////////

    async enable2FA(userId: number) {
        const secret = speakeasy.generateSecret({
            length: 20,
            name: "DoctourApp (${userId})",
        });

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFASecret: secret.base32,
                is2FAEnabled: false,
            },  
        });

        const qrCode= await QRCode.toDataURL(secret.otpauth_url!);
        return { 
            qrCode,
            secret: secret.base32,
            };
        }

    async verify2FA(userId: number, token: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.twoFASecret) {
            throw new UnauthorizedException('2FA not set up');
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: 'base32',
            token,
            window: 1,
        });

        if (!verified) {
            throw new UnauthorizedException('Invalid 2FA token');
        }

        

        await this.prisma.user.update({
            where: { id: userId },
            data: { is2FAEnabled: true },
        });

        return { message : "2FA enabled successfully" }; 

    }

}