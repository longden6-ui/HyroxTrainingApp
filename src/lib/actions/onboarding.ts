'use server';

// Onboarding server actions [T-14, PRD Appendix A]
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/src/lib/auth/session';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateStep6,
} from '../onboarding/schema';
import { detectRedFlags } from '../safety/red-flag';
import { generateTrainingPlan } from './planning';

const prisma = new PrismaClient();

// Save or update onboarding step by step [T-14]
// Progress survives page refresh

export async function saveOnboardingStep1(input: unknown) {
  try {
    const validation = validateStep1(input);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const data = validation.data!;
    const { athleteId, stationRank1, stationRank2, stationRank3 } = data;

    const onboarding = await prisma.onboarding.upsert({
      where: { athleteId },
      update: { stationRank1, stationRank2, stationRank3 },
      create: { athleteId, stationRank1, stationRank2, stationRank3 },
    });

    return { success: true, onboarding };
  } catch (error) {
    console.error('Onboarding step 1 error:', error);
    return { success: false, error: 'Failed to save step 1' };
  }
}

export async function submitOnboardingStep1(stationRank1: string, stationRank2: string, stationRank3: string) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { success: false, error: 'Not authenticated' };
    }

    return saveOnboardingStep1({
      athleteId: session.athleteId,
      stationRank1,
      stationRank2,
      stationRank3,
    });
  } catch (error) {
    console.error('Submit onboarding step 1 error:', error);
    return { success: false, error: 'Failed to save your selections' };
  }
}

export async function saveOnboardingStep2(input: unknown) {
  try {
    const validation = validateStep2(input);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const data = validation.data!;
    const { athleteId, athleticBackground, currentWeeklyLoadMinutes } = data;

    const onboarding = await prisma.onboarding.upsert({
      where: { athleteId },
      update: { athleticBackground, currentWeeklyLoadMinutes },
      create: { athleteId, athleticBackground, currentWeeklyLoadMinutes },
    });

    return { success: true, onboarding };
  } catch (error) {
    console.error('Onboarding step 2 error:', error);
    return { success: false, error: 'Failed to save step 2' };
  }
}

export async function submitOnboardingStep2(athleticBackground: string, currentWeeklyLoadMinutes: number) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { success: false, error: 'Not authenticated' };
    }

    return saveOnboardingStep2({
      athleteId: session.athleteId,
      athleticBackground,
      currentWeeklyLoadMinutes,
    });
  } catch (error) {
    console.error('Submit onboarding step 2 error:', error);
    return { success: false, error: 'Failed to save your information' };
  }
}

export async function saveOnboardingStep3(input: unknown) {
  try {
    const validation = validateStep3(input);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const data = validation.data!;
    const { athleteId, workPattern, physicalDemand } = data;

    const onboarding = await prisma.onboarding.upsert({
      where: { athleteId },
      update: { workPattern, physicalDemand },
      create: { athleteId, workPattern, physicalDemand },
    });

    return { success: true, onboarding };
  } catch (error) {
    console.error('Onboarding step 3 error:', error);
    return { success: false, error: 'Failed to save step 3' };
  }
}

export async function submitOnboardingStep3(workPattern: string, physicalDemand: string) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { success: false, error: 'Not authenticated' };
    }

    return saveOnboardingStep3({
      athleteId: session.athleteId,
      workPattern,
      physicalDemand,
    });
  } catch (error) {
    console.error('Submit onboarding step 3 error:', error);
    return { success: false, error: 'Failed to save your information' };
  }
}

export async function saveOnboardingStep4(input: unknown) {
  try {
    const validation = validateStep4(input);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const data = validation.data!;
    const { athleteId, mobilityStatus, activePain, painDetails } = data;

    const onboarding = await prisma.onboarding.upsert({
      where: { athleteId },
      update: { mobilityStatus, activePain, painDetails: painDetails || null },
      create: { athleteId, mobilityStatus, activePain, painDetails: painDetails || null },
    });

    // Detect red flags from mobility/pain screening [T-15, US-04]
    await detectRedFlags(athleteId);

    return { success: true, onboarding };
  } catch (error) {
    console.error('Onboarding step 4 error:', error);
    return { success: false, error: 'Failed to save step 4' };
  }
}

export async function submitOnboardingStep4(mobilityStatus: string, activePain: boolean, painDetails: string) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { success: false, error: 'Not authenticated' };
    }

    return saveOnboardingStep4({
      athleteId: session.athleteId,
      mobilityStatus,
      activePain,
      painDetails: painDetails || undefined,
    });
  } catch (error) {
    console.error('Submit onboarding step 4 error:', error);
    return { success: false, error: 'Failed to save your information' };
  }
}

export async function saveOnboardingStep5(input: unknown) {
  try {
    const validation = validateStep5(input);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const data = validation.data!;
    const { athleteId, equipment } = data;

    const onboarding = await prisma.onboarding.upsert({
      where: { athleteId },
      update: { equipment: JSON.stringify(equipment) },
      create: { athleteId, equipment: JSON.stringify(equipment) },
    });

    return { success: true, onboarding };
  } catch (error) {
    console.error('Onboarding step 5 error:', error);
    return { success: false, error: 'Failed to save step 5' };
  }
}

export async function submitOnboardingStep5(equipment: string[]) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { success: false, error: 'Not authenticated' };
    }

    return saveOnboardingStep5({
      athleteId: session.athleteId,
      equipment,
    });
  } catch (error) {
    console.error('Submit onboarding step 5 error:', error);
    return { success: false, error: 'Failed to save your information' };
  }
}

export async function saveOnboardingStep6(input: unknown) {
  try {
    const validation = validateStep6(input);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const data = validation.data!;
    const { athleteId, availabilityByDay } = data;

    const onboarding = await prisma.onboarding.upsert({
      where: { athleteId },
      update: { availabilityByDay: JSON.stringify(availabilityByDay) },
      create: { athleteId, availabilityByDay: JSON.stringify(availabilityByDay) },
    });

    return { success: true, onboarding };
  } catch (error) {
    console.error('Onboarding step 6 error:', error);
    return { success: false, error: 'Failed to save step 6' };
  }
}

export async function submitOnboardingStep6(availabilityByDay: Record<string, number>) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Save onboarding step 6
    const saveResult = await saveOnboardingStep6({
      athleteId: session.athleteId,
      availabilityByDay,
    });

    if (!saveResult.success) {
      return saveResult;
    }

    // Generate training plan with default competition date (16 weeks from now)
    const competitionDate = new Date();
    competitionDate.setDate(competitionDate.getDate() + 112); // 16 weeks
    const competitionDateIso = competitionDate.toISOString().split('T')[0];

    const planResult = await generateTrainingPlan({
      competitionDate: competitionDateIso,
    });

    if (!planResult.success) {
      return { success: false, error: planResult.error };
    }

    // Activate the plan immediately [FR-A02]
    await prisma.trainingPlan.update({
      where: { id: planResult.plan!.id },
      data: { status: 'ACTIVE' },
    });

    return { success: true, onboarding: saveResult.onboarding };
  } catch (error) {
    console.error('Submit onboarding step 6 error:', error);
    return { success: false, error: 'Failed to save your information' };
  }
}

// Get current onboarding state [T-14]
export async function getOnboarding(athleteId: string) {
  try {
    const onboarding = await prisma.onboarding.findUnique({
      where: { athleteId },
    });

    if (!onboarding) {
      return { success: true, onboarding: null };
    }

    return {
      success: true,
      onboarding: {
        ...onboarding,
        equipment: onboarding.equipment ? JSON.parse(onboarding.equipment) : [],
        availabilityByDay: onboarding.availabilityByDay ? JSON.parse(onboarding.availabilityByDay) : {},
      },
    };
  } catch (error) {
    console.error('Get onboarding error:', error);
    return { success: false, onboarding: null };
  }
}

// Get current user's onboarding state [T-14]
export async function getCurrentOnboarding() {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { success: false, onboarding: null };
    }

    return getOnboarding(session.athleteId);
  } catch (error) {
    console.error('Get current onboarding error:', error);
    return { success: false, onboarding: null };
  }
}
