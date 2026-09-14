-- Migration: add_mfa_fields
-- Adds TOTP MFA columns to the Athlete table

ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "mfaPending" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "mfaBackupCodes" TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS "Athlete_mfaEnabled_idx" ON "Athlete"("mfaEnabled");
