import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { KycService } from './kyc.service';
import { KycDocumentType, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from './entities/kyc-enums';

const multerOptions = {
  storage: memoryStorage(), // hold in memory, we write to disk in the service
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException(`File type "${file.mimetype}" is not allowed. Upload a JPG, PNG, WEBP, or PDF.`), false);
    }
  },
};

@ApiTags('kyc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /** Get the current user's uploaded documents and KYC status */
  @Get('documents')
  async getMyDocuments(@CurrentUser() user: { id: string }) {
    return this.kycService.getDocumentsForUser(user.id);
  }

  /** Upload passport or national ID */
  @Post('upload/identity')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadIdentity(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    return this.kycService.uploadDocument({
      userId: user.id,
      documentType: KycDocumentType.PASSPORT,
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
  }

  /** Upload proof of address */
  @Post('upload/address')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadAddress(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    return this.kycService.uploadDocument({
      userId: user.id,
      documentType: KycDocumentType.PROOF_OF_ADDRESS,
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
  }

  /** Upload selfie */
  @Post('upload/selfie')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadSelfie(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    return this.kycService.uploadDocument({
      userId: user.id,
      documentType: KycDocumentType.SELFIE,
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
  }

  /** Submit all uploaded documents for admin review */
  @Post('submit')
  async submitForReview(@CurrentUser() user: { id: string }) {
    await this.kycService.submitForReview(user.id);
    return { message: 'Documents submitted for review. You will be notified of the outcome.' };
  }

  /**
   * Serve a document file — authorized access only.
   * The frontend calls this to display/preview a document.
   * Never a public URL.
   */
  @Get('documents/:id/file')
  async serveFile(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
    @Res() res: Response,
  ) {
    const { buffer, mimeType, originalName } = await this.kycService.getDocumentFile(
      id,
      user.id,
      user.role === 'admin',
    );
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buffer);
  }

  /** Get KYC review audit log for current user */
  @Get('log')
  async getMyLog(@CurrentUser() user: { id: string }) {
    return this.kycService.getReviewLog(user.id);
  }
}
