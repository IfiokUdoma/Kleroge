import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { KycDocument } from './entities/kyc-document.entity';
import { KycReviewLog } from './entities/kyc-review-log.entity';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { FileStorageService } from './file-storage.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KycDocument, KycReviewLog]),
    MulterModule.register({}),
    UsersModule,
  ],
  controllers: [KycController],
  providers: [KycService, FileStorageService],
  exports: [KycService],
})
export class KycModule {}
