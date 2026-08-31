// Red-flag safety screening [T-15, FR-G10, US-04]
// Placeholder trigger conditions pending professional approval [PRD open question 12]
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const RED_FLAG_TRIGGERS = {
  // Placeholder triggers - replace with actual professional thresholds
  ACTIVE_PAIN: true, // Active pain is a hard stop (placeholder)
  LIMITED_MOBILITY_WITH_PAIN: true, // Limited mobility + active pain (placeholder)
  EXTREME_WORK_LOAD: 60, // Hours/week that triggers concern (placeholder)
};

// Detect red flags from onboarding data [T-15]
export async function detectRedFlags(athleteId: string): Promise<{
  hasRedFlag: boolean;
  reasons: string[];
}> {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
    });

    const onboarding = await prisma.onboarding.findUnique({
      where: { athleteId },
    });

    const reasons: string[] = [];

    // Check for active pain [T-15, PRD 11]
    if (onboarding?.activePain && RED_FLAG_TRIGGERS.ACTIVE_PAIN) {
      reasons.push('Active pain reported');
    }

    // Check for limited mobility + active pain [T-15, PRD 11]
    if (
      onboarding?.mobilityStatus === 'LIMITED_MOBILITY' &&
      onboarding?.activePain &&
      RED_FLAG_TRIGGERS.LIMITED_MOBILITY_WITH_PAIN
    ) {
      reasons.push('Limited mobility with active pain');
    }

    // Check for extreme occupational load [T-15, FR-G03]
    if (
      onboarding?.currentWeeklyLoadMinutes &&
      onboarding.currentWeeklyLoadMinutes > RED_FLAG_TRIGGERS.EXTREME_WORK_LOAD * 60
    ) {
      reasons.push('Very high occupational load');
    }

    const hasRedFlag = reasons.length > 0;

    // Update athlete's redFlag status [T-15]
    if (hasRedFlag !== (athlete?.redFlag || false)) {
      await prisma.athlete.update({
        where: { id: athleteId },
        data: { redFlag: hasRedFlag },
      });

      // Write audit event [T-15]
      await prisma.auditEvent.create({
        data: {
          athleteId,
          eventType: 'SAFETY_FLAG',
          description: hasRedFlag ? `Red flag detected: ${reasons.join(', ')}` : 'Red flag cleared',
          metadata: JSON.stringify({ reasons }), // Never include sensitive values
        },
      });
    }

    return { hasRedFlag, reasons };
  } catch (error) {
    console.error('Red flag detection error:', error);
    return { hasRedFlag: false, reasons: [] };
  }
}

// Check if athlete can proceed to plan generation [T-15]
export async function canGeneratePlan(athleteId: string): Promise<{
  allowed: boolean;
  message?: string;
}> {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
    });

    if (!athlete) {
      return { allowed: false, message: 'Athlete not found' };
    }

    if (athlete.redFlag) {
      return {
        allowed: false,
        message:
          'We recommend consulting with a healthcare provider before starting this training program. Your profile includes factors that suggest professional guidance would be beneficial.',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Plan generation check error:', error);
    return { allowed: false, message: 'Unable to verify plan generation eligibility' };
  }
}
