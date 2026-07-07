-- Rename integration → app across DB
ALTER TABLE "integration" RENAME TO "app";
ALTER TYPE "public"."integration_type" RENAME TO "app_type";
ALTER TYPE "public"."integration_status" RENAME TO "app_status";

-- Rename FK column on signal table
ALTER TABLE "signal" RENAME COLUMN "integration_id" TO "app_id";
