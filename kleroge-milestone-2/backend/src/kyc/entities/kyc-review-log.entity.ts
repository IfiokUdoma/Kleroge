import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum KycReviewAction {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RESUBMITTED = 'resubmitted',
}

/**
 * Immutable audit log of every KYC status change.
 * Answers "who approved this and when" — one of the flaws
 * called out in the architecture review.
 */
@Entity('kyc_review_log')
export class KycReviewLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: KycReviewAction })
  action: KycReviewAction;

  /** null for system/user-triggered actions (submit, resubmit) */
  @Column({ type: 'varchar', nullable: true })
  adminId: string | null;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
