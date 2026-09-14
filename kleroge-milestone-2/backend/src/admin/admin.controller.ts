import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user-enums';
import { KycService } from '../kyc/kyc.service';

class ReviewKycDto {
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
  constructor(private readonly kycService: KycService) {}

  /** List all KYC submissions pending review */
  @Get('kyc/pending')
  async getPendingKyc() {
    return this.kycService.getPendingSubmissions();
  }

  /** Approve or reject a user's KYC */
  @Post('kyc/:userId/review')
  async reviewKyc(
    @Param('userId') userId: string,
    @Body() dto: ReviewKycDto,
    @CurrentUser() admin: { id: string },
  ) {
    await this.kycService.reviewSubmission(userId, {
      adminId: admin.id,
      action: dto.action,
      rejectionReason: dto.rejectionReason,
    });
    return {
      message: `KYC for user ${userId} has been ${dto.action === 'approve' ? 'approved' : 'rejected'}.`,
    };
  }

  /** View KYC review log for a specific user */
  @Get('kyc/:userId/log')
  async getUserKycLog(@Param('userId') userId: string) {
    return this.kycService.getReviewLog(userId);
  }
}
