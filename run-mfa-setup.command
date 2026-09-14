#!/bin/zsh
echo "=== HYROX MFA Setup ==="

# Apply migration
echo "Applying MFA database migration..."
psql postgresql://hyrox_user@localhost:5432/hyrox_db << 'SQL'
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "mfaPending" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "mfaBackupCodes" TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS "Athlete_mfaEnabled_idx" ON "Athlete"("mfaEnabled");
SQL

echo "Done. You can now restart the dev server: npm run dev"
