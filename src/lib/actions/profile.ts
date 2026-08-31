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
        firstName: athlete.firstName || '',
        lastName: athlete.lastName || '',
        createdAt: athlete.createdAt,

        // Onboarding details (if available)
        onboarding: athlete.onboarding ? {
          finishTimeEstimate: athlete.targetFinishTime ? `${Math.floor(athlete.targetFinishTime / 60)} min` : '',
          raceDate: athlete.competitionDate,

          // Demographics
          age: athlete.age?.toString() || '',
          gender: athlete.gender || '',

          // Experience
          hyroxExperience: athlete.priorHyroxResult || '',
          fitnessLevel: athlete.onboarding.athleticBackground || '',

          // Goals
          primaryGoal: '',

          // Training info
          trainingDaysPerWeek: athlete.onboarding.currentWeeklyLoadMinutes ? Math.round(athlete.onboarding.currentWeeklyLoadMinutes / (8 * 60)) : undefined,
          availabilityByDay: athlete.onboarding.availabilityByDay ? JSON.parse(athlete.onboarding.availabilityByDay) : null,

          // Equipment
          equipment: athlete.onboarding.equipment ? JSON.parse(athlete.onboarding.equipment) : [],

          // Station preferences (rankings)
          stationRank1: athlete.onboarding.stationRank1 || '',
          stationRank2: athlete.onboarding.stationRank2 || '',
        } : null,
      },
    };
  } catch (error) {
    console.error('Failed to load profile:', error);
    return { error: 'Failed to load profile' };
  }
}

// Update athlete profile details [T-25]
export async function updateAthleteProfile(data: {
  firstName?: string;
  lastName?: string;
  ageGroup?: string;
  gender?: string;
  finishTimeEstimate?: string;
  raceDate?: string;
  hyroxExperience?: string;
  fitnessLevel?: string;
  primaryGoal?: string;
  trainingDaysPerWeek?: number;
  stationRank1?: string;
  stationRank2?: string;
}) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    // Update athlete basic info and race details
    const athleteUpdate: any = {};
    if (data.firstName !== undefined) athleteUpdate.firstName = data.firstName;
    if (data.lastName !== undefined) athleteUpdate.lastName = data.lastName;
    if (data.ageGroup !== undefined) athleteUpdate.age = data.ageGroup ? parseInt(data.ageGroup) : null;
    if (data.gender !== undefined) athleteUpdate.gender = data.gender;
    if (data.finishTimeEstimate !== undefined) {
      // Parse "120 min" format to seconds
      const minutes = parseInt(data.finishTimeEstimate);
      athleteUpdate.targetFinishTime = !isNaN(minutes) ? minutes * 60 : null;
    }
    if (data.raceDate !== undefined) athleteUpdate.competitionDate = data.raceDate ? new Date(data.raceDate) : null;
    if (data.hyroxExperience !== undefined) athleteUpdate.priorHyroxResult = data.hyroxExperience;

    if (Object.keys(athleteUpdate).length > 0) {
      await prisma.athlete.update({
        where: { id: session.athleteId },
        data: athleteUpdate,
      });
    }

    // Update onboarding info (station preferences and fitness level)
    if (data.stationRank1 !== undefined || data.stationRank2 !== undefined || data.fitnessLevel !== undefined || data.trainingDaysPerWeek !== undefined) {
      const onboardingUpdate: any = {};

      if (data.stationRank1 !== undefined) onboardingUpdate.stationRank1 = data.stationRank1;
      if (data.stationRank2 !== undefined) onboardingUpdate.stationRank2 = data.stationRank2;
      if (data.fitnessLevel !== undefined) onboardingUpdate.athleticBackground = data.fitnessLevel;
      if (data.trainingDaysPerWeek !== undefined) {
        // Convert days per week to minutes per week (assuming 8 hours per training day)
        onboardingUpdate.currentWeeklyLoadMinutes = data.trainingDaysPerWeek ? data.trainingDaysPerWeek * 8 * 60 : null;
      }

      await prisma.onboarding.updateMany({
        where: { athleteId: session.athleteId },
        data: onboardingUpdate,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update profile:', error);
    return { error: 'Failed to update profile' };
  }
}
