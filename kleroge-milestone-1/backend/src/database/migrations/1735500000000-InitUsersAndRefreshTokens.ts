import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitUsersAndRefreshTokens1735500000000 implements MigrationInterface {
  name = 'InitUsersAndRefreshTokens1735500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('buyer', 'seller', 'admin')
    `);
    await queryRunner.query(`
      CREATE TYPE "users_kycstatus_enum" AS ENUM ('not_started', 'pending', 'approved', 'rejected')
    `);
    await queryRunner.query(`
      CREATE TYPE "users_accountstatus_enum" AS ENUM ('active', 'suspended', 'banned')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "fullName" varchar(120) NOT NULL,
        "email" varchar(255) NOT NULL,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "phone" varchar(32),
        "phoneVerified" boolean NOT NULL DEFAULT false,
        "passwordHash" varchar NOT NULL,
        "country" varchar(2) NOT NULL,
        "preferredCurrency" varchar(3) NOT NULL DEFAULT 'USD',
        "role" "users_role_enum" NOT NULL DEFAULT 'buyer',
        "kycStatus" "users_kycstatus_enum" NOT NULL DEFAULT 'not_started',
        "accountStatus" "users_accountstatus_enum" NOT NULL DEFAULT 'active',
        "tokenVersion" integer NOT NULL DEFAULT 0,
        "lastLoginAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tokenHash" varchar NOT NULL,
        "userAgent" varchar,
        "ipAddress" varchar,
        "expiresAt" timestamptz NOT NULL,
        "revoked" boolean NOT NULL DEFAULT false,
        "revokedAt" timestamptz,
        "replacedByTokenId" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_tokenHash" UNIQUE ("tokenHash"),
        CONSTRAINT "FK_refresh_tokens_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId")`);

    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_tokenHash" ON "refresh_tokens" ("tokenHash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_accountstatus_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_kycstatus_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
