import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user-enums';
import { KycService } from '../kyc/kyc.service';
import { PropertiesService } from '../properties/properties.service';

class ReviewKycDto {
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

class ReviewPropertyDto {
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly kycService: KycService,
    private readonly propertiesService: PropertiesService,
  ) {}

  @Get('kyc/pending')
  async getPendingKyc() { return this.kycService.getPendingSubmissions(); }

  @Post('kyc/:userId/review')
  async reviewKyc(@Param('userId') userId: string, @Body() dto: ReviewKycDto, @CurrentUser() admin: { id: string }) {
    await this.kycService.reviewSubmission(userId, { adminId: admin.id, action: dto.action, rejectionReason: dto.rejectionReason });
    return { message: `KYC ${dto.action === 'approve' ? 'approved' : 'rejected'} for user ${userId}.` };
  }

  @Get('kyc/:userId/log')
  async getUserKycLog(@Param('userId') userId: string) { return this.kycService.getReviewLog(userId); }

  @Get('properties/pending')
  async getPendingProperties() { return this.propertiesService.getPendingListings(); }

  @Post('properties/:propertyId/review')
  async reviewProperty(@Param('propertyId') propertyId: string, @Body() dto: ReviewPropertyDto, @CurrentUser() admin: { id: string }) {
    if (dto.action === 'approve') {
      await this.propertiesService.approveProperty(propertyId, admin.id);
      return { message: `Property ${propertyId} approved and now live.` };
    } else {
      await this.propertiesService.rejectProperty(propertyId, admin.id, dto.rejectionReason ?? '');
      return { message: `Property ${propertyId} rejected.` };
    }
  }

  @Get('properties/:propertyId/history')
  async getPropertyHistory(@Param('propertyId') propertyId: string) { return this.propertiesService.getStatusHistory(propertyId); }
}
