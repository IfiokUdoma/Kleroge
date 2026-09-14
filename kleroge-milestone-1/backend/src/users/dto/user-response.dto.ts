import { User } from '../entities/user.entity';

/**
 * Explicit allowlist of fields safe to return from the API.
 * We never spread the raw entity into a response, even though passwordHash
 * has `select: false` — defense in depth against a future query that does
 * select it (e.g. for password comparison) and accidentally returns it.
 */
export class UserResponseDto {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  country: string;
  preferredCurrency: string;
  role: string;
  kycStatus: string;
  accountStatus: string;
  createdAt: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.fullName = user.fullName;
    dto.email = user.email;
    dto.emailVerified = user.emailVerified;
    dto.phone = user.phone;
    dto.phoneVerified = user.phoneVerified;
    dto.country = user.country;
    dto.preferredCurrency = user.preferredCurrency;
    dto.role = user.role;
    dto.kycStatus = user.kycStatus;
    dto.accountStatus = user.accountStatus;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
