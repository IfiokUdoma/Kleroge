import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { KycDocument } from '../kyc/entities/kyc-document.entity';
import { KycReviewLog } from '../kyc/entities/kyc-review-log.entity';
import { Property } from '../properties/entities/property.entity';
import { PropertyStatusHistory } from '../properties/entities/property-status-history.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'kleroge',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kleroge_dev',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [User, RefreshToken, KycDocument, KycReviewLog, Property, PropertyStatusHistory],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
