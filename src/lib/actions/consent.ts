'use server';

// Consent management server actions [T-12, FR-P07]
import { PrismaClient } from '@prisma/client';
import { ConsentDocumentType, CONSENT_VERSIONS, validateConsent } from '../consent/schema';

const prisma = new PrismaClient();

// Capture consent at signup [T-12]
export async function captureSignupConsents(athleteId: string) {
  try {
    const now = new Date();

    // Create consents for all required documents
    const documents = [
      ConsentDocumentType.TERMS,
      ConsentDocumentType.PRIVACY,
      ConsentDocumentType.SAFETY_DISCLAIMER,
      ConsentDocumentType.SENSITIVE_DATA,
    ];

    const consents = await Promise.all(
      documents.map((documentType) =>
        prisma.consent.create({
          data: {
            athleteId,
            documentType,
            version: CONSENT_VERSIONS[documentType],
            grantedAt: now,
          },
        }),
      ),
    );

    return { success: true, consents };
  } catch (error) {
    console.error('Consent capture error:', error);
    return { success: false, errors: { _form: ['Failed to capture consents'] } };
  }
}

// Update consent (withdrawal writes new row, doesn't mutate) [T-12]
export async function updateConsent(input: unknown) {
  try {
    const validation = validateConsent(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const { athleteId, documentType, grant } = validation.data;

    // Verify athlete exists
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
    });

    if (!athlete) {
      return {
        success: false,
        errors: { athleteId: ['Athlete not found'] },
      };
    }

    const now = new Date();

    if (grant) {
      // Grant consent: create new row
      const consent = await prisma.consent.create({
        data: {
          athleteId,
          documentType,
          version: CONSENT_VERSIONS[documentType],
          grantedAt: now,
        },
      });
      return { success: true, consent };
    } else {
      // Withdraw consent: create new row with withdrawnAt timestamp
      // Original grant row remains intact for audit trail [T-12]
      const consent = await prisma.consent.create({
        data: {
          athleteId,
          documentType,
          version: CONSENT_VERSIONS[documentType],
          withdrawnAt: now,
        },
      });
      return { success: true, consent };
    }
  } catch (error) {
    console.error('Consent update error:', error);
    return { success: false, errors: { _form: ['Failed to update consent'] } };
  }
}

// Query whether athlete has granted consent [T-12]
export async function hasConsent(
  athleteId: string,
  documentType: ConsentDocumentType,
): Promise<boolean> {
  try {
    // Get the most recent consent record
    const latestConsent = await prisma.consent.findFirst({
      where: {
        athleteId,
        documentType,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!latestConsent) return false;

    // If latest record has withdrawnAt, consent is withdrawn
    if (latestConsent.withdrawnAt) return false;

    // If latest record has grantedAt, consent is granted
    return !!latestConsent.grantedAt;
  } catch (error) {
    console.error('Consent query error:', error);
    return false;
  }
}

// Get full consent history for an athlete [T-12, audit trail]
export async function getConsentHistory(athleteId: string) {
  try {
    const consents = await prisma.consent.findMany({
      where: { athleteId },
      orderBy: { createdAt: 'asc' },
    });

    return { success: true, consents };
  } catch (error) {
    console.error('Consent history error:', error);
    return { success: false, consents: [] };
  }
}
