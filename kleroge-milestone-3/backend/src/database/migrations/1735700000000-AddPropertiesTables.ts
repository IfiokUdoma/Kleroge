import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertiesTables1735700000000 implements MigrationInterface {
  name = 'AddPropertiesTables1735700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "property_type_enum" AS ENUM (
        'residential','commercial','land','industrial','mixed_use'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "listing_status_enum" AS ENUM (
        'draft','pending','approved','rejected','sold','delisted'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "property_currency_enum" AS ENUM (
        'USD','GBP','EUR','NGN','GHS','KES','ZAR','AED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "properties" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sellerId" uuid NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL,
        "propertyType" "property_type_enum" NOT NULL,
        "country" varchar(2) NOT NULL,
        "city" varchar(100) NOT NULL,
        "address" varchar(255),
        "price" numeric(18,2) NOT NULL,
        "currency" "property_currency_enum" NOT NULL DEFAULT 'USD',
        "areaSqm" numeric(10,2),
        "bedrooms" integer,
        "bathrooms" integer,
        "imagePaths" jsonb NOT NULL DEFAULT '[]',
        "documentPaths" jsonb NOT NULL DEFAULT '[]',
        "status" "listing_status_enum" NOT NULL DEFAULT 'draft',
        "rejectionReason" varchar,
        "reviewedByAdminId" uuid,
        "reviewedAt" timestamptz,
        "publishedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_properties_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_properties_sellerId"
          FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_properties_sellerId" ON "properties" ("sellerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_status" ON "properties" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_country" ON "properties" ("country")`);

    await queryRunner.query(`
      CREATE TABLE "property_status_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "propertyId" uuid NOT NULL,
        "fromStatus" "listing_status_enum" NOT NULL,
        "toStatus" "listing_status_enum" NOT NULL,
        "actorId" uuid,
        "note" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_property_status_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_property_status_history_propertyId"
          FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_property_status_history_propertyId" ON "property_status_history" ("propertyId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "property_status_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "properties"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "property_currency_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "listing_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "property_type_enum"`);
  }
}
