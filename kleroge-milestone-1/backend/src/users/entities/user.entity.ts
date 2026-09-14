import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountStatus, KycStatus, UserRole } from './user-enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  fullName: string;

  @Index({ unique: true })
  @Column({ length: 255, unique: true })
  email: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ length: 32, nullable: true })
  phone: string | null;

  @Column({ default: false })
  phoneVerified: boolean;

  /** bcrypt hash — never the raw password, never returned in API responses. */
  @Column({ select: false })
  passwordHash: string;

  /** ISO 3166-1 alpha-2 country code, e.g. "NG", "US". */
  @Column({ length: 2 })
  country: string;

  @Column({ length: 3, default: 'USD' })
  preferredCurrency: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUYER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.NOT_STARTED,
  })
  kycStatus: KycStatus;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  accountStatus: AccountStatus;

  /**
   * Incremented whenever all sessions for this user must be invalidated
   * (password change, suspected compromise, manual admin action, ban).
   * Access tokens embed this value; the auth guard rejects any token
   * whose tokenVersion doesn't match the current value, giving us
   * effective revocation without a server-side token blocklist.
   */
  @Column({ type: 'int', default: 0 })
  tokenVersion: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
