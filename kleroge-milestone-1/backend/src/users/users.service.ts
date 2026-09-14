import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const user = this.usersRepository.create(input);
    return this.usersRepository.save(user);
  }

  /** Includes passwordHash — only ever used internally for login comparison. */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      select: [
        'id',
        'fullName',
        'email',
        'passwordHash',
        'role',
        'kycStatus',
        'accountStatus',
        'tokenVersion',
        'country',
        'preferredCurrency',
        'emailVerified',
        'phone',
        'phoneVerified',
        'createdAt',
      ],
    });
  }

  async findByEmailOrNull(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async findByIdOrNull(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    await this.usersRepository.update(id, dto);
    const updated = await this.findByIdOrNull(id);
    if (!updated) {
      throw new Error('User disappeared during update — this should not happen.');
    }
    return updated;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  /**
   * Bumping tokenVersion immediately invalidates every previously issued
   * access token for this user (the JWT strategy checks this on every
   * request), independent of refresh token revocation. Used on password
   * change, suspected compromise, or admin-initiated force logout.
   */
  async bumpTokenVersion(id: string): Promise<void> {
    await this.usersRepository.increment({ id }, 'tokenVersion', 1);
  }

  async setPasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update(id, { passwordHash });
  }
}
