import { IsNotEmpty,Matches}   from "class-validator";
export class VerifyFADto {
    @IsNotEmpty()
    @Matches(/^\d{6}$/, { message: 'OTP MUST be a 6-digit number' })
    token:string;
}