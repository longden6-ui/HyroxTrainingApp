// Immutability enforcement at data layer [T-27, FR-A02]
// Locked sessions reject all writes

import { PrismaClient, TrainingSession } from '@prisma/client';

const prisma = new PrismaClient();

// Check if session is locked before any modification [T-27, FR-A02]
export async function requireSessionUnlocked(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    select: { locked: true },
  });

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  if (session.locked) {
    return {
      success: false,
      error: 'Cannot modify completed session. Completed sessions are immutable.',
    };
  }

  return { success: true };
}

// Prevent session deletion if locked [T-27]
export async function deleteSessionIfUnlocked(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const check = await requireSessionUnlocked(sessionId);
  if (!check.success) {
    return check;
  }

  try {
    await prisma.trainingSession.delete({
      where: { id: sessionId },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete session' };
  }
}

// Prevent session update if locked [T-27]
export async function updateSessionIfUnlocked(
  sessionId: string,
  data: Partial<TrainingSession>,
): Promise<{ success: boolean; session?: TrainingSession; error?: string }> {
  const check = await requireSessionUnlocked(sessionId);
  if (!check.success) {
    return check;
  }

  try {
    const updated = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        ...data,
        locked: false, // Cannot re-lock, only initial lock allowed
      },
    });
    return { success: true, session: updated };
  } catch (error) {
    return { success: false, error: 'Failed to update session' };
  }
}

// Move session (reschedule) only if unlocked [T-27, T-28]
export async function moveSessionIfUnlocked(
  sessionId: string,
  newDate: Date,
): Promise<{ success: boolean; session?: TrainingSession; error?: string }> {
  const check = await requireSessionUnlocked(sessionId);
  if (!check.success) {
    return check;
  }

  try {
    const moved = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: { scheduledDate: newDate },
    });
    return { success: true, session: moved };
  } catch (error) {
    return { success: false, error: 'Failed to reschedule session' };
  }
}
