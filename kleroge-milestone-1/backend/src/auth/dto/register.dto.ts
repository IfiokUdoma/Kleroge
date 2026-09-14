import {
  IsEmail,
  IsEnum,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../users/entities/user-enums';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/;

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must be at least 10 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.',
  })
  password: string;

  /** ISO 3166-1 alpha-2, e.g. "NG", "US", "GB". Validated against a known list in the service layer. */
  @IsString()
  @Length(2, 2)
  country: string;

  /** Only buyer/seller can be selected at signup — admin is never self-assigned. */
  @IsEnum([UserRole.BUYER, UserRole.SELLER], {
    message: 'role must be either buyer or seller',
  })
  role: UserRole.BUYER | UserRole.SELLER;
}
