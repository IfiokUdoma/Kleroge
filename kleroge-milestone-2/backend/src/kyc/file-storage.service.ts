import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StoredFile {
  storagePath: string;
  filename: string;
}

/**
 * Abstracts file storage so the KYC service doesn't care whether files
 * are on disk or in S3. To migrate to S3 in a later milestone, only this
 * file changes — everything else stays the same.
 *
 * KYC files are stored OUTSIDE the web-accessible public directory.
 * Access is always through the signed-URL endpoint, never direct.
 */
@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly uploadRoot: string;

  constructor(private readonly config: ConfigService) {
    this.uploadRoot = config.get<string>('storage.uploadRoot') ?? path.join(process.cwd(), 'uploads');
    this.ensureDirectory(path.join(this.uploadRoot, 'kyc'));
  }

  async saveKycFile(
    userId: string,
    documentType: string,
    buffer: Buffer,
    originalName: string,
  ): Promise<StoredFile> {
    const ext = path.extname(originalName).toLowerCase() || '.bin';
    const filename = `${uuidv4()}${ext}`;
    const userDir = path.join(this.uploadRoot, 'kyc', userId);
    this.ensureDirectory(userDir);

    const fullPath = path.join(userDir, filename);
    fs.writeFileSync(fullPath, buffer);

    this.logger.log(`KYC file saved: ${fullPath} (type: ${documentType})`);

    // storagePath is relative to uploadRoot — makes it portable
    return {
      storagePath: path.join('kyc', userId, filename),
      filename,
    };
  }

  readKycFile(storagePath: string): Buffer {
    const fullPath = path.join(this.uploadRoot, storagePath);
    return fs.readFileSync(fullPath);
  }

  deleteKycFile(storagePath: string): void {
    const fullPath = path.join(this.uploadRoot, storagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      this.logger.log(`KYC file deleted: ${fullPath}`);
    }
  }

  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
