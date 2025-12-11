import {IsEmail,IsNotEmpty,IsOptional,Matches,MinLength} from 'class-validator';


export class CreatePatientDto {
    @IsEmail({},{message:'Invalid email format'})
    email: string;

    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    password: string;

    @IsNotEmpty({message:'Phone Number is required'})
    @MinLength(8,{message:'Phone Number must be at least 8 characters'})
    phoneNumber: string;

    @IsOptional()
    firstName?: string;

    @IsOptional()
    lastName?: string;

    @IsOptional()
    address?: string;

    @IsNotEmpty({message:'CIN is required'})
    @Matches(/^\d{8}$/, { message: 'CIN must be exactly 8 digits' })
    cin?: string;

}