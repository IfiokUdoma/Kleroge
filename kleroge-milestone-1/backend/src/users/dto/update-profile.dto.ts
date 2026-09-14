import { IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  preferredCurrency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}
