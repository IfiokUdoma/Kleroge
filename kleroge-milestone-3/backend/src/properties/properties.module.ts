import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { PropertyStatusHistory } from './entities/property-status-history.entity';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { KycModule } from '../kyc/kyc.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, PropertyStatusHistory]),
    KycModule,
    UsersModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
