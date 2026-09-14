import {
  BadRequestException, Body, Controller, Get,
  Param, Patch, Post, Query, Res,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../kyc/entities/kyc-enums';

const imageInterceptor = FileInterceptor('file', {
  storage: require('multer').memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req: any, file: any, cb: any) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    imageTypes.includes(file.mimetype) ? cb(null, true) : cb(new BadRequestException('Images only: JPG, PNG, WEBP.'), false);
  },
});

const docInterceptor = FileInterceptor('file', {
  storage: require('multer').memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req: any, file: any, cb: any) => {
    ALLOWED_MIME_TYPES.includes(file.mimetype) ? cb(null, true) : cb(new BadRequestException('JPG, PNG, WEBP, or PDF only.'), false);
  },
});

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  /** Public: browse approved listings */
  @Get()
  async getListings(
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('type') propertyType?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.propertiesService.getApprovedListings({
      country, city, propertyType,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  }

  /** Public: single listing detail */
  @Get(':id')
  async getListing(@Param('id') id: string) {
    return this.propertiesService.getByIdOrThrow(id);
  }

  /** Public: serve property image */
  @Get(':id/images/:index')
  async getImage(@Param('id') id: string, @Param('index') index: string, @Res() res: Response) {
    const { buffer, mimeType } = await this.propertiesService.serveImage(id, parseInt(index, 10));
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  }

  /** Seller: create draft listing */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async createListing(@CurrentUser() user: { id: string }, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.createListing(user.id, dto);
  }

  /** Seller: upload image to listing */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @UseInterceptors(imageInterceptor)
  async uploadImage(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No image uploaded.');
    return this.propertiesService.uploadPropertyImage(id, user.id, file.buffer, file.originalname, file.mimetype);
  }

  /** Seller: upload ownership document */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/documents')
  @UseInterceptors(docInterceptor)
  async uploadDocument(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No document uploaded.');
    return this.propertiesService.uploadPropertyDocument(id, user.id, file.buffer, file.originalname);
  }

  /** Seller: submit listing for admin approval */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/submit')
  async submitListing(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.propertiesService.submitForApproval(id, user.id);
  }

  /** Seller: delist property */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/delist')
  async delistListing(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.propertiesService.delistProperty(id, user.id);
  }

  /** Seller: get own listings */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('seller/my-listings')
  async getMyListings(@CurrentUser() user: { id: string }) {
    return this.propertiesService.getSellerListings(user.id);
  }

  /** Get status history for a listing */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.propertiesService.getStatusHistory(id);
  }
}
