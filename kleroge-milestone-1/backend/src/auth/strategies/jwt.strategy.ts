import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AccountStatus } from '../../users/entities/user-enums';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret'),
    });
  }

  /**
   * Runs on every authenticated request. We re-check the user's current
   * tokenVersion and account status against the database (not just trusting
   * the token payload) so that a ban, suspension, or forced logout takes
   * effect immediately rather than waiting for token expiry.
   */
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findByIdOrNull(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Account no longer exists.');
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active.');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Session has been revoked. Please log in again.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus,
      tokenVersion: user.tokenVersion,
    };
  }
}
