import { Controller, Post,Body, UseGuards,Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/Login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { VerifyFADto } from './dto/twofa-code.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService:AuthService) {}
    @Post('login')
    async login(@Body() dto:LoginDto){
        return this.authService.loginWithDto(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('2fa/setup')
    enable2FA(@Req() req){
        return this.authService.enable2FA(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('2fa/verify')
    verify2FA(
        @Req() req,
        @Body() dto: VerifyFADto,
    ){
        return this.authService.verify2FA(req.user.id,dto.token);
    }
}
