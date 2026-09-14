import {
  BadRequestException, ForbiddenException,
  Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { PropertyStatusHistory } from './entities/property-status-history.entity';
import { ListingStatus } from './entities/property-enums';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FileStorageService } from '../kyc/file-storage.service';
import { KycStatus, UserRole } from '../users/entities/user-enums';
import { UsersService } from '../users/users.service';

export interface PropertyFilters {
  country?: string;
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
}

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(PropertyStatusHistory)
    private readonly historyRepo: Repository<PropertyStatusHistory>,
    private readonly fileStorage: FileStorageService,
    private readonly usersService: UsersService,
  ) {}

  async createListing(sellerId: string, dto: CreatePropertyDto): Promise<Property> {
    const seller = await this.usersService.findByIdOrNull(sellerId);
    if (!seller) throw new NotFoundException('User not found.');

    if (seller.role !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can create property listings.');
    }
    if (seller.kycStatus !== KycStatus.APPROVED) {
      throw new ForbiddenException(
        'Your identity must be verified before you can list a property. Complete KYC first.',
      );
    }

    const property = this.propertyRepo.create({
      sellerId,
      ...dto,
      status: ListingStatus.DRAFT,
      imagePaths: [],
      documentPaths: [],
    });

    const saved = await this.propertyRepo.save(property);
    await this.logStatusChange(saved.id, ListingStatus.DRAFT, ListingStatus.DRAFT, sellerId, 'Listing created as draft.');
    this.logger.log(`Seller ${sellerId} created property ${saved.id}`);
    return saved;
  }

  async uploadPropertyImage(
    propertyId: string,
    sellerId: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<Property> {
    const property = await this.findOwnedOrThrow(propertyId, sellerId);

    if (property.imagePaths.length >= 10) {
      throw new BadRequestException('Maximum 10 images per listing.');
    }
    if (property.status === ListingStatus.PENDING) {
      throw new ForbiddenException('Cannot edit a listing that is under review.');
    }

    const stored = await this.fileStorage.saveKycFile(
      `property-${propertyId}`, 'image', buffer, originalName,
    );

    property.imagePaths = [...property.imagePaths, stored.storagePath];
    return this.propertyRepo.save(property);
  }

  async uploadPropertyDocument(
    propertyId: string,
    sellerId: string,
    buffer: Buffer,
    originalName: string,
  ): Promise<Property> {
    const property = await this.findOwnedOrThrow(propertyId, sellerId);

    if (property.status === ListingStatus.PENDING) {
      throw new ForbiddenException('Cannot edit a listing that is under review.');
    }

    const stored = await this.fileStorage.saveKycFile(
      `property-${propertyId}`, 'document', buffer, originalName,
    );

    const withDocs = await this.propertyRepo.findOne({
      where: { id: propertyId },
      select: ['id', 'documentPaths', 'sellerId', 'title', 'status',
               'imagePaths', 'description', 'propertyType', 'country',
               'city', 'address', 'price', 'currency', 'areaSqm',
               'bedrooms', 'bathrooms', 'rejectionReason', 'reviewedByAdminId',
               'reviewedAt', 'publishedAt', 'createdAt', 'updatedAt'],
    });

    withDocs!.documentPaths = [...(withDocs!.documentPaths || []), stored.storagePath];
    return this.propertyRepo.save(withDocs!);
  }

  /** Submit a draft listing for admin approval */
  async submitForApproval(propertyId: string, sellerId: string): Promise<Property> {
    const property = await this.findOwnedOrThrow(propertyId, sellerId);

    if (![ListingStatus.DRAFT, ListingStatus.REJECTED].includes(property.status)) {
      throw new BadRequestException(`Cannot submit — listing is currently "${property.status}".`);
    }
    if (property.imagePaths.length === 0) {
      throw new BadRequestException('Upload at least one image before submitting.');
    }

    const prev = property.status;
    property.status = ListingStatus.PENDING;
    const saved = await this.propertyRepo.save(property);
    await this.logStatusChange(propertyId, prev, ListingStatus.PENDING, sellerId, 'Submitted for admin approval.');
    return saved;
  }

  /** Seller delists their own property */
  async delistProperty(propertyId: string, sellerId: string): Promise<Property> {
    const property = await this.findOwnedOrThrow(propertyId, sellerId);
    if ([ListingStatus.SOLD, ListingStatus.DELISTED].includes(property.status)) {
      throw new BadRequestException('This listing is already closed.');
    }
    const prev = property.status;
    property.status = ListingStatus.DELISTED;
    const saved = await this.propertyRepo.save(property);
    await this.logStatusChange(propertyId, prev, ListingStatus.DELISTED, sellerId, 'Seller delisted.');
    return saved;
  }

  /** Admin: approve a listing */
  async approveProperty(propertyId: string, adminId: string): Promise<Property> {
    const property = await this.getByIdOrThrow(propertyId);
    if (property.status !== ListingStatus.PENDING) {
      throw new BadRequestException(`Cannot approve — listing is "${property.status}".`);
    }
    property.status = ListingStatus.APPROVED;
    property.reviewedByAdminId = adminId;
    property.reviewedAt = new Date();
    property.publishedAt = new Date();
    const saved = await this.propertyRepo.save(property);
    await this.logStatusChange(propertyId, ListingStatus.PENDING, ListingStatus.APPROVED, adminId, 'Approved by admin.');
    this.logger.log(`Admin ${adminId} approved property ${propertyId}`);
    return saved;
  }

  /** Admin: reject a listing with a reason */
  async rejectProperty(propertyId: string, adminId: string, reason: string): Promise<Property> {
    if (!reason?.trim()) throw new BadRequestException('Rejection reason is required.');
    const property = await this.getByIdOrThrow(propertyId);
    if (property.status !== ListingStatus.PENDING) {
      throw new BadRequestException(`Cannot reject — listing is "${property.status}".`);
    }
    property.status = ListingStatus.REJECTED;
    property.rejectionReason = reason;
    property.reviewedByAdminId = adminId;
    property.reviewedAt = new Date();
    const saved = await this.propertyRepo.save(property);
    await this.logStatusChange(propertyId, ListingStatus.PENDING, ListingStatus.REJECTED, adminId, reason);
    this.logger.log(`Admin ${adminId} rejected property ${propertyId}: ${reason}`);
    return saved;
  }

  /** Public: browse approved listings */
  async getApprovedListings(filters: PropertyFilters): Promise<Property[]> {
    const qb = this.propertyRepo.createQueryBuilder('p')
      .where('p.status = :status', { status: ListingStatus.APPROVED });

    if (filters.country)      qb.andWhere('p.country = :country',           { country: filters.country });
    if (filters.city)         qb.andWhere('LOWER(p.city) LIKE :city',       { city: `%${filters.city.toLowerCase()}%` });
    if (filters.propertyType) qb.andWhere('p.propertyType = :type',         { type: filters.propertyType });
    if (filters.minPrice)     qb.andWhere('p.price >= :min',                { min: filters.minPrice });
    if (filters.maxPrice)     qb.andWhere('p.price <= :max',                { max: filters.maxPrice });

    return qb.orderBy('p.publishedAt', 'DESC').limit(50).getMany();
  }

  async getById(id: string): Promise<Property | null> {
    return this.propertyRepo.findOne({ where: { id } });
  }

  async getByIdOrThrow(id: string): Promise<Property> {
    const p = await this.getById(id);
    if (!p) throw new NotFoundException('Property not found.');
    return p;
  }

  async getSellerListings(sellerId: string): Promise<Property[]> {
    return this.propertyRepo.find({
      where: { sellerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getStatusHistory(propertyId: string): Promise<PropertyStatusHistory[]> {
    return this.historyRepo.find({
      where: { propertyId },
      order: { createdAt: 'ASC' },
    });
  }

  async getPendingListings(): Promise<Property[]> {
    return this.propertyRepo.find({
      where: { status: ListingStatus.PENDING },
      order: { updatedAt: 'ASC' },
    });
  }

  async serveImage(propertyId: string, index: number): Promise<{ buffer: Buffer; mimeType: string }> {
    const property = await this.getByIdOrThrow(propertyId);
    if (index < 0 || index >= property.imagePaths.length) {
      throw new NotFoundException('Image not found.');
    }
    const buffer = this.fileStorage.readKycFile(property.imagePaths[index]);
    const ext = property.imagePaths[index].split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    return { buffer, mimeType: mimeMap[ext] ?? 'image/jpeg' };
  }

  private async findOwnedOrThrow(propertyId: string, sellerId: string): Promise<Property> {
    const property = await this.getByIdOrThrow(propertyId);
    if (property.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this listing.');
    }
    return property;
  }

  private async logStatusChange(
    propertyId: string,
    from: ListingStatus,
    to: ListingStatus,
    actorId: string | null,
    note: string,
  ): Promise<void> {
    await this.historyRepo.save(
      this.historyRepo.create({ propertyId, fromStatus: from, toStatus: to, actorId, note }),
    );
  }
}
