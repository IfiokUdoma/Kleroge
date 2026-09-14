import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { KycDocumentStatus, KycDocumentType } from './kyc-enums';

/**
 * Each row is one uploaded file for one user.
 * A user can have at most one active document per type
 * (uploading again replaces the previous one).
 *
 * Files are stored on disk (local for MVP, S3-ready).
 * The storagePath is NEVER returned to clients — they get
 * a signed URL generated on demand. This is the access-control
 * fix called out in the architecture review.
 */
@Entity('kyc_documents')
export class KycDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: KycDocumentType })
  documentType: KycDocumentType;

  @Column({ type: 'enum', enum: KycDocumentStatus, default: KycDocumentStatus.UPLOADED })
  status: KycDocumentStatus;

  /** Original filename as uploaded — for display only */
  @Column({ type: 'varchar' })
  originalName: string;

  /** MIME type — validated on upload */
  @Column({ type: 'varchar' })
  mimeType: string;

  /** File size in bytes */
  @Column({ type: 'int' })
  sizeBytes: number;

  /**
   * Path on disk (or S3 key in future).
   * Never exposed directly in API responses.
   * Access always goes through a signed/authorized endpoint.
   */
  @Column({ type: 'varchar', select: false })
  storagePath: string;

  /** Admin rejection reason — shown to user if status is rejected */
  @Column({ type: 'varchar', nullable: true })
  rejectionReason: string | null;

  /** Which admin reviewed this document */
  @Column({ type: 'varchar', nullable: true })
  reviewedByAdminId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
