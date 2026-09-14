import { UserRole } from '../../users/entities/user-enums';

export interface JwtPayload {
  /** subject = user id */
  sub: string;
  email: string;
  role: UserRole;
  /** must match the user's current tokenVersion or the token is rejected */
  tokenVersion: number;
}
