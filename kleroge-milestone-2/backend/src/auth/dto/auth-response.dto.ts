import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  /** seconds until access token expiry, lets the frontend schedule a silent refresh */
  expiresIn: number;
}

export class AuthResponseDto {
  user: UserResponseDto;
  tokens: AuthTokensDto;
}
