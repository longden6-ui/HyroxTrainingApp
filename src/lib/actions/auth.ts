'use server';

// Authentication server actions [T-11, PRD 9.6]
import { PrismaClient } from '@prisma/client';
import { validateSignup, validateSignin } from '../auth/schema';
import { hashPassword, verifyPassword } from '../auth/password';
import { createSession, clearSession } from '../auth/session';
import { captureSignupConsents } from './consent';

const prisma = new PrismaClient();

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

    // Create session
    await createSession(athlete.id, athlete.email, athlete.role);

    return {
      success: true,
      athleteId: athlete.id,
      email: athlete.email,
    };
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

    // Create session
    await createSession(athlete.id, athlete.email, athlete.role);

    return {
      success: true,
      athleteId: athlete.id,
      email: athlete.email,
    };
  } catch (error) {
    console.error('Signin error:', error);
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
