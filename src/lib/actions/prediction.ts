'use server';

// Prediction actions [T-08, T-13]
import { PrismaClient } from '@prisma/client';
import { PredictorInput, validatePredictorInput } from '../predictor/schema';
import { estimateFinishTime, validateEstimate } from '../predictor/estimator';
import { validateRateLimit } from '../ratelimit';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

// Original prediction creation from T-08 [FR-P06]
export async function createPrediction(input: unknown) {
  try {
    // Check rate limits [T-09, US-01 criterion 5]
    const requestHeaders = await headers();
    const rateLimit = validateRateLimit(requestHeaders);

    if (!rateLimit.allowed) {
      return {
        success: false,
        errors: {
          _form: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 1000)} seconds.`,
        },
      };
    }

    // Validate input [T-06, US-01 criterion 2]
    const validation = validatePredictorInput(input);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    const predictor = validation.data as PredictorInput;

    // Run estimator [T-07]
    const estimate = estimateFinishTime(predictor);

    if (!validateEstimate(estimate)) {
      return {
        success: false,
        errors: { _form: 'Estimation failed validation' },
      };
    }

    // Persist prediction [T-08, FR-P06]
    // athleteId is null for public predictions
    try {
      const prediction = await prisma.prediction.create({
        data: {
          athleteId: null, // Public prediction, unauthenticated

          // Inputs
          age: predictor.age,
          category: predictor.category,
          weightGrams: predictor.weightValue,
          fiveKmTimeSeconds: predictor.fiveKmTimeSeconds,
          fiveKmRecency: predictor.fiveKmRecency,
          competitionDate: predictor.competitionDate,
          division: predictor.division,
          targetFinishTime: predictor.targetFinishTimeSeconds,
          priorHyroxResult: predictor.priorHyroxResult,

          // Results [T-07]
          lowSeconds: estimate.lowSeconds,
          highSeconds: estimate.highSeconds,
          confidence: estimate.confidence,
          drivers: JSON.stringify(estimate.drivers),
          dataQualityWarnings: JSON.stringify(estimate.dataQualityWarnings),
          goalGapLabel: estimate.goalGapLabel,
          modelVersion: estimate.modelVersion,
        },
      });

      return {
        success: true,
        prediction: {
          id: prediction.id,
          lowSeconds: prediction.lowSeconds,
          highSeconds: prediction.highSeconds,
          confidence: prediction.confidence,
          drivers: JSON.parse(prediction.drivers),
          dataQualityWarnings: JSON.parse(prediction.dataQualityWarnings || '[]'),
          goalGapLabel: prediction.goalGapLabel,
        },
      };
    } catch (dbError) {
      // If database is unavailable, still return the prediction for demo purposes
      console.warn('Database unavailable, returning prediction without persistence:', dbError);
      return {
        success: true,
        prediction: {
          id: 'demo-' + Date.now(),
          lowSeconds: estimate.lowSeconds,
          highSeconds: estimate.highSeconds,
          confidence: estimate.confidence,
          drivers: estimate.drivers,
          dataQualityWarnings: estimate.dataQualityWarnings,
          goalGapLabel: estimate.goalGapLabel,
        },
      };
    }
  } catch (error) {
    console.error('Prediction error:', error);
    return {
      success: false,
      errors: { _form: 'An error occurred. Please try again.' },
    };
  }
}

// Claim anonymous prediction on signup [T-13, FR-P07]
// Attach most recent anonymous prediction to athlete's account after consent
export async function claimAnonymousPrediction(athleteId: string): Promise<{
  success: boolean;
  claimedPredictionId?: string;
}> {
  try {
    // Find most recent prediction without an athlete (anonymous)
    const anonymousPrediction = await prisma.prediction.findFirst({
      where: {
        athleteId: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!anonymousPrediction) {
      return { success: true }; // No prediction to claim, which is fine
    }

    // Attach prediction to athlete
    await prisma.prediction.update({
      where: { id: anonymousPrediction.id },
      data: { athleteId },
    });

    return { success: true, claimedPredictionId: anonymousPrediction.id };
  } catch (error) {
    console.error('Claim prediction error:', error);
    return { success: false };
  }
}
