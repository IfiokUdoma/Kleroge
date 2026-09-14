import {
  Column, CreateDateColumn, Entity, Index,
  ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ListingStatus, PropertyCurrency, PropertyType } from './property-enums';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The seller who owns this listing */
  @Index()
  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  seller: User;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: PropertyType })
  propertyType: PropertyType;

  /** ISO 3166-1 alpha-2 */
  @Column({ type: 'varchar', length: 2 })
  country: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: PropertyCurrency, default: PropertyCurrency.USD })
  currency: PropertyCurrency;

  /** Area in square metres */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  areaSqm: number | null;

  @Column({ type: 'int', nullable: true })
  bedrooms: number | null;

  @Column({ type: 'int', nullable: true })
  bathrooms: number | null;

  /**
   * JSON array of image paths (relative to uploads root).
   * Same private-access pattern as KYC docs — never served via CDN directly.
   * Max 10 images per listing.
   */
  @Column({ type: 'jsonb', default: [] })
  imagePaths: string[];

  /**
   * JSON array of document paths (title deed, survey plan, etc.)
   * Admin-only viewable during approval review.
   */
  @Column({ type: 'jsonb', default: [], select: false })
  documentPaths: string[];

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.DRAFT })
  status: ListingStatus;

  /** Reason returned to seller if rejected */
  @Column({ type: 'varchar', nullable: true })
  rejectionReason: string | null;

  /** Admin who approved/rejected */
  @Column({ type: 'uuid', nullable: true })
  reviewedByAdminId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
