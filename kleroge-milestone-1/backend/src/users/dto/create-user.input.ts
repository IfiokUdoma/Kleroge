import { UserRole } from '../entities/user-enums';

export interface CreateUserInput {
  fullName: string;
  email: string;
  passwordHash: string;
  country: string;
  role: UserRole.BUYER | UserRole.SELLER;
}
