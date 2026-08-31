'use server';

import { PrismaClient } from '@prisma/client';
import { getSession } from '@/src/lib/auth/session';

const prisma = new PrismaClient();

// Mark a training session as completed [T-24]
export async function completeTrainingSession(sessionId: string, notes?: string) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    // Verify the session belongs to the authenticated athlete
    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: sessionId,
        athleteId: session.athleteId,
      },
    });

    if (!trainingSession) {
      return { error: 'Session not found' };
    }

    // Update session as completed
    const updatedSession = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        locked: true,
      },
    });

    // Create or update check-in with completion
    await prisma.sessionCheckIn.upsert({
      where: { sessionId },
      update: {
        completedAt: new Date(),
        completionStatus: 'COMPLETED',
        notes,
      },
      create: {
        sessionId,
        athleteId: session.athleteId,
        completedAt: new Date(),
        completionStatus: 'COMPLETED',
        rpe: 5,
        notes,
      },
    });

    return {
      success: true,
      session: {
        id: updatedSession.id,
        completed: updatedSession.locked,
      },
    };
  } catch (error) {
    console.error('Failed to complete session:', error);
    return { error: 'Failed to complete session' };
  }
}

// Add or update session notes [T-24]
export async function updateSessionNotes(sessionId: string, notes: string) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    // Verify the session belongs to the authenticated athlete
    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: sessionId,
        athleteId: session.athleteId,
      },
    });

    if (!trainingSession) {
      return { error: 'Session not found' };
    }

    // Create or update check-in with notes
    const checkIn = await prisma.sessionCheckIn.upsert({
      where: { sessionId },
      update: {
        notes,
      },
      create: {
        sessionId,
        athleteId: session.athleteId,
        completedAt: new Date(),
        completionStatus: 'COMPLETED',
        rpe: 5,
        notes,
      },
    });

    return {
      success: true,
      notes: checkIn.notes,
    };
  } catch (error) {
    console.error('Failed to update notes:', error);
    return { error: 'Failed to update notes' };
  }
}
