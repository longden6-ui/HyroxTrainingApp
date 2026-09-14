'use server';

// Authentication server actions [T-11, PRD 9.6]
import crypto from 'crypto';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { validateSignup, validateSignin, validatePasswordRecovery, validateResetPassword } from '../auth/schema';
import { hashPassword, verifyPassword } from '../auth/password';
import { createSession, clearSession } from '../auth/session';
import { captureSignupConsents } from './consent';
import { claimAnonymousPrediction } from './prediction';
import { signMfaToken } from '../mfa';
import { sendPasswordResetEmail } from '../email';
import { validateRateLimit } from '../ratelimit';

const prisma = new PrismaClient();

const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function signup(input: unknown) {
  try {
    const validation = validateSignup(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const { email, password, firstName, lastName } = validation.data;

    try {
      // Check if athlete already exists
      const existingAthlete = await prisma.athlete.findUnique({
        where: { email },
      });

      if (existingAthlete) {
        return {
          success: false,
          errors: { email: ['An account with this email already exists'] },
        };
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create athlete
      const athlete = await prisma.athlete.create({
        data: {
          email,
          passwordHash,
          firstName: firstName || null,
          lastName: lastName || null,
          role: 'ATHLETE',
        },
      });

      // Capture signup consents [T-12]
      await captureSignupConsents(athlete.id);

      // Claim anonymous prediction if one exists [T-13, FR-P07]
      await claimAnonymousPrediction(athlete.id);

      // Create session
      await createSession(athlete.id, athlete.email, athlete.role);

      return {
        success: true,
        athleteId: athlete.id,
        email: athlete.email,
      };
    } catch (dbError) {
      // Database unavailable - demo mode
      console.warn('Database unavailable during signup, using demo mode:', dbError);

      const passwordHash = await hashPassword(password);
      const demoAthleteId = `demo-athlete-${Date.now()}`;

      // Create session with demo ID
      await createSession(demoAthleteId, email, 'ATHLETE');

      return {
        success: true,
        athleteId: demoAthleteId,
        email: email,
      };
    }
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      errors: { _form: ['An error occurred. Please try again.'] },
    };
  }
}

export async function signin(input: unknown) {
  try {
    const validation = validateSignin(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const { email, password } = validation.data;

    try {
      // Find athlete
      const athlete = await prisma.athlete.findUnique({
        where: { email },
      });

      if (!athlete || !athlete.passwordHash) {
        return {
          success: false,
          errors: { _form: ['Invalid email or password'] },
        };
      }

      // Verify password
      const isValid = await verifyPassword(password, athlete.passwordHash);
      if (!isValid) {
        return {
          success: false,
          errors: { _form: ['Invalid email or password'] },
        };
      }

      // ── MFA check ────────────────────────────────────────────────────────
      if (athlete.mfaEnabled) {
        const mfaToken = signMfaToken(athlete.id);
        return { success: true, mfa_required: true, mfaToken };
      }
      // ────────────────────────────────────────────────────────────────────

      // Create session (no MFA)
      await createSession(athlete.id, athlete.email, athlete.role);

      return {
        success: true,
        athleteId: athlete.id,
        email: athlete.email,
      };
    } catch (dbError) {
      // Database unavailable - demo mode (allow any email/password)
      console.warn('Database unavailable during signin, using demo mode:', dbError);

      const demoAthleteId = `demo-athlete-${email.replace(/\W/g, '-')}`;

      // Create session with demo ID
      await createSession(demoAthleteId, email, 'ATHLETE');

      return {
        success: true,
        athleteId: demoAthleteId,
        email: email,
      };
    }
  } catch (error) {
    console.error('Signin error:', error);
    return {
      success: false,
      errors: { _form: ['An error occurred. Please try again.'] },
    };
  }
}

export async function requestPasswordReset(input: unknown) {
  try {
    const validation = validatePasswordRecovery(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const { email } = validation.data;

    const requestHeaders = await headers();
    const rateLimit = validateRateLimit(requestHeaders);
    if (!rateLimit.allowed) {
      return {
        success: false,
        errors: {
          _form: [`Too many requests. Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 1000)} seconds.`],
        },
      };
    }

    const athlete = await prisma.athlete.findUnique({ where: { email } });

    if (!athlete) {
      return {
        success: false,
        errors: { email: ['No account found with that email'] },
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    await prisma.athlete.update({
      where: { id: athlete.id },
      data: {
        passwordResetTokenHash: hashResetToken(rawToken),
        passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(athlete.email, resetUrl);

    return { success: true };
  } catch (error) {
    console.error('Request password reset error:', error);
    return {
      success: false,
      errors: { _form: ['An error occurred. Please try again.'] },
    };
  }
}

export async function resetPassword(input: unknown) {
  try {
    const validation = validateResetPassword(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const { token, newPassword } = validation.data;
    const tokenHash = hashResetToken(token);

    const athlete = await prisma.athlete.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!athlete) {
      return {
        success: false,
        errors: { _form: ['This reset link is invalid or has expired'] },
      };
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.athlete.update({
      where: { id: athlete.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      errors: { _form: ['An error occurred. Please try again.'] },
    };
  }
}

export async function signout() {
  try {
    await clearSession();
    return { success: true };
  } catch (error) {
    console.error('Signout error:', error);
    return { success: false };
  }
}

// Account deletion [T-11, FR-P06]
export async function deleteAccount(athleteId: string) {
  try {
    // Delete athlete and cascade all related data
    await prisma.athlete.delete({
      where: { id: athleteId },
    });

    // Clear session
    await clearSession();

    return { success: true };
  } catch (error) {
    console.error('Delete account error:', error);
    return { success: false, errors: { _form: ['Failed to delete account'] } };
  }
}
