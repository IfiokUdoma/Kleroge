import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { KycModule } from '../kyc/kyc.module';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [KycModule, PropertiesModule],
  controllers: [AdminController],
})
export class AdminModule {}
