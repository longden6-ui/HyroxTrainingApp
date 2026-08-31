'use server';

// Workout template admin actions [T-16, PRD 9.3]
import { PrismaClient } from '@prisma/client';
import {
  validateCreateTemplate,
  validateApproveTemplate,
  validateCreateSubstitution,
  TemplateStatus,
} from '../templates/schema';
import { getSession } from '../auth/session';

const prisma = new PrismaClient();

// Admin-only check
async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
  });

  if (athlete?.role !== 'ADMIN') {
    return { error: 'Admin access required' };
  }

  return { success: true };
}

// Create template (admin) [T-16]
export async function createTemplate(input: unknown) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck.error) {
      return { success: false, errors: { _form: [adminCheck.error] } };
    }

    const validation = validateCreateTemplate(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const data = validation.data!;

    const template = await prisma.workoutTemplate.create({
      data: {
        name: data.name,
        version: data.version,
        description: data.description || null,
        duration: data.duration,
        warmupDuration: data.warmupDuration || null,
        mainDuration: data.mainDuration || null,
        cooldownDuration: data.cooldownDuration || null,
        primaryFocus: data.primaryFocus,
        phase: data.phase || null,
        stationName: data.stationName || null,
        equipment: JSON.stringify(data.equipment),
        intensityLevel: data.intensityLevel || null,
        purposeStatement: data.purposeStatement,
        instructions: data.instructions || null,
        status: TemplateStatus.DRAFT,
      },
    });

    return { success: true, template };
  } catch (error) {
    console.error('Create template error:', error);
    return { success: false, errors: { _form: ['Failed to create template'] } };
  }
}

// Approve template (admin) [T-16, Constraint 4]
export async function approveTemplate(input: unknown) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck.error) {
      return { success: false, errors: { _form: [adminCheck.error] } };
    }

    const validation = validateApproveTemplate(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const data = validation.data!;
    const now = new Date();

    const template = await prisma.workoutTemplate.update({
      where: { id: data.templateId },
      data: {
        status: TemplateStatus.APPROVED,
        approvedBy: data.approvedBy,
        approvedAt: now,
      },
    });

    // Write audit event
    const session = await getSession();
    if (session) {
      await prisma.auditEvent.create({
        data: {
          athleteId: session.athleteId,
          eventType: 'PLAN_GENERATED', // Using existing event type for approvals
          description: `Template "${template.name}" approved by ${data.approvedBy}`,
        },
      });
    }

    return { success: true, template };
  } catch (error) {
    console.error('Approve template error:', error);
    return { success: false, errors: { _form: ['Failed to approve template'] } };
  }
}

// Reject template (return to DRAFT)
export async function rejectTemplate(templateId: string) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck.error) {
      return { success: false, errors: { _form: [adminCheck.error] } };
    }

    const template = await prisma.workoutTemplate.update({
      where: { id: templateId },
      data: {
        status: TemplateStatus.DRAFT,
        approvedBy: null,
        approvedAt: null,
      },
    });

    return { success: true, template };
  } catch (error) {
    console.error('Reject template error:', error);
    return { success: false, errors: { _form: ['Failed to reject template'] } };
  }
}

// Get templates (filters for selectable status) [T-16]
export async function getSelectableTemplates() {
  try {
    const templates = await prisma.workoutTemplate.findMany({
      where: {
        status: TemplateStatus.APPROVED, // Only approved templates can be selected
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      templates: templates.map((t) => ({
        ...t,
        equipment: JSON.parse(t.equipment || '[]'),
      })),
    };
  } catch (error) {
    console.error('Get templates error:', error);
    return { success: false, templates: [] };
  }
}

// Create substitution (admin) [T-16]
export async function createSubstitution(input: unknown) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck.error) {
      return { success: false, errors: { _form: [adminCheck.error] } };
    }

    const validation = validateCreateSubstitution(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const data = validation.data!;

    const substitution = await prisma.templateSubstitution.create({
      data: {
        templateId: data.templateId,
        originalExercise: data.originalExercise,
        substituteName: data.substituteName,
        explanation: data.explanation,
      },
    });

    return { success: true, substitution };
  } catch (error) {
    console.error('Create substitution error:', error);
    return { success: false, errors: { _form: ['Failed to create substitution'] } };
  }
}

// Get template with substitutions
export async function getTemplate(templateId: string) {
  try {
    const template = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      include: { substitutions: true },
    });

    if (!template) {
      return { success: false, template: null };
    }

    return {
      success: true,
      template: {
        ...template,
        equipment: JSON.parse(template.equipment || '[]'),
      },
    };
  } catch (error) {
    console.error('Get template error:', error);
    return { success: false, template: null };
  }
}
