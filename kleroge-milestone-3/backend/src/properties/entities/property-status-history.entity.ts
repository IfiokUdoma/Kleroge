import {
  Column, CreateDateColumn, Entity,
  Index, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { ListingStatus } from './property-enums';

/**
 * Immutable log of every status change on a property listing.
 * Fixes the "no audit trail" issue flagged in the architecture review.
 */
@Entity('property_status_history')
export class PropertyStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  propertyId: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  property: Property;

  @Column({ type: 'enum', enum: ListingStatus })
  fromStatus: ListingStatus;

  @Column({ type: 'enum', enum: ListingStatus })
  toStatus: ListingStatus;

  /** null for seller-triggered transitions (create, submit, delist) */
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
