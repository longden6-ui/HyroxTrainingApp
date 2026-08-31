'use server';

import { PrismaClient } from '@prisma/client';
import { getSession } from '@/src/lib/auth/session';

const prisma = new PrismaClient();

// Fetch athlete's complete profile details [T-25]
export async function getAthleteProfile() {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      include: {
        onboarding: true,
      },
    });

    if (!athlete) {
      return { error: 'Profile not found' };
    }

    return {
      success: true,
      profile: {
        // Basic info
        id: athlete.id,
        email: athlete.email,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        createdAt: athlete.createdAt,

        // Onboarding details (if available)
        onboarding: athlete.onboarding ? {
          finishTimeEstimate: athlete.onboarding.finishTimeEstimate,
          raceDate: athlete.onboarding.raceDate,

          // Demographics
          age: athlete.onboarding.ageGroup,
          gender: athlete.onboarding.gender,

          // Experience
          hyroxExperience: athlete.onboarding.hyroxExperience,
          fitnessLevel: athlete.onboarding.fitnessLevel,

          // Goals
          primaryGoal: athlete.onboarding.primaryGoal,

          // Training info
          trainingDaysPerWeek: athlete.onboarding.trainingDaysPerWeek,
          availabilityByDay: athlete.onboarding.availabilityByDay ? JSON.parse(athlete.onboarding.availabilityByDay) : null,

          // Equipment
          equipment: athlete.onboarding.equipment ? JSON.parse(athlete.onboarding.equipment) : [],

          // Station preferences (rankings)
          stationRank1: athlete.onboarding.stationRank1,
          stationRank2: athlete.onboarding.stationRank2,
        } : null,
      },
    };
  } catch (error) {
    console.error('Failed to load profile:', error);
    return { error: 'Failed to load profile' };
  }
}
