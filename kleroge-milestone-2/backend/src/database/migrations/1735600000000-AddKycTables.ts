import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycTables1735600000000 implements MigrationInterface {
  name = 'AddKycTables1735600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "kyc_document_type_enum" AS ENUM (
        'passport', 'national_id', 'proof_of_address', 'selfie'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "kyc_document_status_enum" AS ENUM (
        'uploaded', 'under_review', 'accepted', 'rejected'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "kyc_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" varchar NOT NULL,
        "documentType" "kyc_document_type_enum" NOT NULL,
        "status" "kyc_document_status_enum" NOT NULL DEFAULT 'uploaded',
        "originalName" varchar NOT NULL,
        "mimeType" varchar NOT NULL,
        "sizeBytes" integer NOT NULL,
        "storagePath" varchar NOT NULL,
        "rejectionReason" varchar,
        "reviewedByAdminId" varchar,
        "reviewedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kyc_documents_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_kyc_documents_userId"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_kyc_documents_userId" ON "kyc_documents" ("userId")`,
    );

    await queryRunner.query(`
      CREATE TYPE "kyc_review_action_enum" AS ENUM (
        'submitted', 'approved', 'rejected', 'resubmitted'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "kyc_review_log" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" varchar NOT NULL,
        "action" "kyc_review_action_enum" NOT NULL,
        "adminId" varchar,
        "note" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kyc_review_log_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_kyc_review_log_userId"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_kyc_review_log_userId" ON "kyc_review_log" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "kyc_review_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kyc_documents"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "kyc_review_action_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "kyc_document_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "kyc_document_type_enum"`);
  }
}
