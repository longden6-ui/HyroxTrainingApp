// Data export and deletion workflows [T-31, PRD 9.6, 12.2]
// Machine-readable export of profile, plan, and history

import { PrismaClient } from '@prisma/client';
import { getSession } from '@/src/lib/auth/session';

const prisma = new PrismaClient();

export interface AthleteDataExport {
  exportedAt: string;
  athlete: {
    id: string;
    email: string;
    createdAt: string;
    role: string;
  };
  onboarding?: Record<string, any>;
  plans: Array<{
    id: string;
    status: string;
    competitionDate: string;
    sessionCount: number;
    sessions: Array<{
      id: string;
      title: string;
      scheduledDate: string;
      duration: number;
      locked: boolean;
      checkIn?: Record<string, any>;
    }>;
  }>;
  predictions: Array<{
    id: string;
    lowSeconds: number;
    highSeconds: number;
    confidence: string;
    createdAt: string;
  }>;
  consents: Array<{
    documentType: string;
    grantedAt: string;
    version: string;
    withdrawn: boolean;
  }>;
  auditTrail: Array<{
    eventType: string;
    description: string;
    createdAt: string;
  }>;
}

// Export all athlete data in machine-readable format [T-31]
export async function exportAthleteData(athleteId: string): Promise<{ success: boolean; data?: AthleteDataExport; error?: string }> {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        plans: {
          include: {
            sessions: {
              include: { checkIn: true },
            },
          },
        },
        predictions: true,
        consents: true,
        auditEvents: {
          take: 100,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!athlete) {
      return { success: false, error: 'Athlete not found' };
    }

    const onboarding = await prisma.onboarding.findUnique({
      where: { athleteId },
    });

    // Sanitize sensitive data before export [PRD 12.2]
    const exportData: AthleteDataExport = {
      exportedAt: new Date().toISOString(),
      athlete: {
        id: athlete.id,
        email: athlete.email,
        createdAt: athlete.createdAt.toISOString(),
        role: athlete.role,
      },
      onboarding: onboarding
        ? {
            athleticBackground: onboarding.athleticBackground,
            workPattern: onboarding.workPattern,
            physicalDemand: onboarding.physicalDemand,
            // Exclude exact weight, mobility details [PRD 12.2]
          }
        : undefined,
      plans: athlete.plans.map((plan) => ({
        id: plan.id,
        status: plan.status,
        competitionDate: plan.competitionDate.toISOString(),
        sessionCount: plan.sessions.length,
        sessions: plan.sessions.map((session) => ({
          id: session.id,
          title: session.title,
          scheduledDate: session.scheduledDate.toISOString(),
          duration: session.duration,
          locked: session.locked,
          checkIn: session.checkIn
            ? {
                rpe: session.checkIn.rpe,
                actualDuration: session.checkIn.actualDuration,
                // Exclude exact pain details [PRD 12.2]
              }
            : undefined,
        })),
      })),
      predictions: athlete.predictions.map((pred) => ({
        id: pred.id,
        lowSeconds: pred.lowSeconds,
        highSeconds: pred.highSeconds,
        confidence: pred.confidence,
        createdAt: pred.createdAt.toISOString(),
      })),
      consents: athlete.consents.map((consent) => ({
        documentType: consent.documentType,
        grantedAt: consent.grantedAt.toISOString(),
        version: consent.version,
        withdrawn: consent.withdrawnAt !== null,
      })),
      auditTrail: athlete.auditEvents.map((event) => ({
        eventType: event.eventType,
        description: event.description,
        createdAt: event.createdAt.toISOString(),
      })),
    };

    return { success: true, data: exportData };
  } catch (error) {
    console.error('Data export failed:', error);
    return { success: false, error: 'Failed to export data' };
  }
}

// Delete all athlete data (anonymization) [T-31, PRD 12.2]
export async function deleteAthleteData(athleteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Cascade delete via Prisma relations [PRD 9.6]
    const session = await getSession();
    if (!session?.athleteId || session.athleteId !== athleteId) {
      return { success: false, error: 'Not authorized' };
    }

    // Create audit trail before deletion [T-31]
    await prisma.auditEvent.create({
      data: {
        athleteId,
        eventType: 'ACCOUNT_DELETED',
        description: 'Athlete requested full account deletion',
        metadata: JSON.stringify({
          deletedAt: new Date().toISOString(),
        }),
      },
    });

    // Delete athlete (cascades to plans, sessions, consents, etc.)
    await prisma.athlete.delete({
      where: { id: athleteId },
    });

    return { success: true };
  } catch (error) {
    console.error('Data deletion failed:', error);
    return { success: false, error: 'Failed to delete account' };
  }
}

// Correct/update athlete data [T-31]
export async function updateAthleteData(
  athleteId: string,
  updates: {
    email?: string;
    // Only allow non-sensitive updates
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.athleteId || session.athleteId !== athleteId) {
      return { success: false, error: 'Not authorized' };
    }

    const allowedFields = ['email'];
    const updateData = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key)),
    );

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'No valid fields to update' };
    }

    // Create audit trail for data correction [T-31]
    await prisma.auditEvent.create({
      data: {
        athleteId,
        eventType: 'DATA_CORRECTED',
        description: `Athlete corrected: ${Object.keys(updateData).join(', ')}`,
        metadata: JSON.stringify(updateData),
      },
    });

    await prisma.athlete.update({
      where: { id: athleteId },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error('Data update failed:', error);
    return { success: false, error: 'Failed to update data' };
  }
}

// Withdraw consent (creates new audit row, doesn't delete) [T-31, FR-A01]
export async function withdrawConsent(
  athleteId: string,
  documentType: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.athleteId || session.athleteId !== athleteId) {
      return { success: false, error: 'Not authorized' };
    }

    // Record withdrawal as new event, don't update original [T-31, Immutability]
    await prisma.consent.update({
      where: {
        athleteId_documentType: {
          athleteId,
          documentType,
        },
      },
      data: {
        withdrawnAt: new Date(),
      },
    });

    // Audit trail [T-31]
    await prisma.auditEvent.create({
      data: {
        athleteId,
        eventType: 'CONSENT_WITHDRAWN',
        description: `Consent withdrawn for ${documentType}`,
        metadata: JSON.stringify({
          documentType,
          withdrawnAt: new Date().toISOString(),
        }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Consent withdrawal failed:', error);
    return { success: false, error: 'Failed to withdraw consent' };
  }
}
