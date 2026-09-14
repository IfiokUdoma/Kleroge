import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * We never store raw refresh tokens — only a hash of them, same principle
 * as passwords. This means a stolen database dump still can't be replayed
 * directly into valid sessions.
 *
 * Storing tokens server-side (rather than relying purely on stateless JWTs)
 * is what lets us:
 *  - revoke a single device/session on demand ("log out everywhere")
 *  - see active sessions per user for the security/device-tracking
 *    requirement called out in the backend doc
 *  - detect refresh token reuse (a strong signal of token theft)
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Index()
  @Column()
  userId: string;

  @Index({ unique: true })
  @Column()
  tokenHash: string;

  @Column({ nullable: true })
  userAgent: string | null;

  @Column({ nullable: true })
  ipAddress: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  /** Set when a token is rotated, pointing to its replacement — useful for reuse detection. */
  @Column({ nullable: true })
  replacedByTokenId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
