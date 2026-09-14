-- Migration: add_password_reset_fields
-- Adds password-reset token columns to the Athlete table
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" TEXT;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP(3);
