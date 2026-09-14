import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, AuthTokensDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshToken } from './entities/refresh-token.entity';
import { hashToken, parseDurationToMs } from './utils/token.util';
import { isSupportedCountry } from '../common/constants/countries';

const BCRYPT_ROUNDS = 12;

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    if (!isSupportedCountry(dto.country)) {
      throw new BadRequestException(
        `Kleroge is not yet available in country "${dto.country}". Contact support if you believe this is an error.`,
      );
    }

    const existing = await this.usersService.findByEmailOrNull(normalizedEmail);
    if (existing) {
      // Deliberately vague — don't confirm/deny which emails are registered.
      throw new ConflictException('Unable to create account with the provided details.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      fullName: dto.fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      country: dto.country.toUpperCase(),
      role: dto.role,
    });

    const tokens = await this.issueTokenPair(user.id, user.email, user.role, user.tokenVersion, meta);

    return {
      user: UserResponseDto.fromEntity(user),
      tokens,
    };
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmailWithPassword(normalizedEmail);

    // Same error for "no such user" and "wrong password" — never reveal
    // which emails exist on the platform.
    const invalidCredentialsError = new UnauthorizedException('Invalid email or password.');

    if (!user) {
      throw invalidCredentialsError;
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw invalidCredentialsError;
    }

    if (user.accountStatus !== 'active') {
      throw new UnauthorizedException('This account is not active. Contact support.');
    }

    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.issueTokenPair(user.id, user.email, user.role, user.tokenVersion, meta);

    return {
      user: UserResponseDto.fromEntity(user),
      tokens,
    };
  }

  /**
   * Refresh token rotation: every refresh issues a brand-new refresh token
   * and revokes the old one. If a revoked/already-used refresh token is
   * presented again, that's a strong signal of theft — we treat it as
   * such by revoking the entire token family (all sessions for this user).
   */
  async refresh(rawRefreshToken: string, meta: RequestMeta): Promise<AuthTokensDto> {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (stored.revoked) {
      // Reuse of a revoked token — possible theft. Nuke all sessions.
      await this.usersService.bumpTokenVersion(stored.userId);
      await this.refreshTokenRepository.update({ userId: stored.userId }, { revoked: true });
      throw new UnauthorizedException(
        'This session has been invalidated for security reasons. Please log in again.',
      );
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token has expired. Please log in again.');
    }

    const user = await this.usersService.findByIdOrNull(stored.userId);
    if (!user || user.accountStatus !== 'active') {
      throw new UnauthorizedException('Account is not active.');
    }

    // Rotate: revoke this one, issue a fresh pair.
    const tokens = await this.issueTokenPair(user.id, user.email, user.role, user.tokenVersion, meta);
    stored.revoked = true;
    stored.revokedAt = new Date();
    await this.refreshTokenRepository.save(stored);

    return tokens;
  }

  /** Revokes a single refresh token (the one used to call this endpoint) — "log out this device". */
  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await this.refreshTokenRepository.update({ tokenHash }, { revoked: true, revokedAt: new Date() });
  }

  /** Revokes every session for a user and invalidates outstanding access tokens — "log out everywhere". */
  async logoutAllSessions(userId: string): Promise<void> {
    await this.refreshTokenRepository.update({ userId }, { revoked: true, revokedAt: new Date() });
    await this.usersService.bumpTokenVersion(userId);
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    role: JwtPayload['role'],
    tokenVersion: number,
    meta: RequestMeta,
  ): Promise<AuthTokensDto> {
    const payload: JwtPayload = { sub: userId, email, role, tokenVersion };

    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn')!;
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn')!;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: accessExpiresIn,
    });

    const rawRefreshToken = `${uuidv4()}.${uuidv4()}`;
    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId,
      tokenHash: hashToken(rawRefreshToken),
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt: new Date(Date.now() + parseDurationToMs(refreshExpiresIn)),
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: Math.floor(parseDurationToMs(accessExpiresIn) / 1000),
    };
  }
}
