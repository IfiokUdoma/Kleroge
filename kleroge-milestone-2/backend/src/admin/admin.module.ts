import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [KycModule],
  controllers: [AdminController],
})
export class AdminModule {}
