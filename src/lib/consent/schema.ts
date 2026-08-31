// Consent schema and validation [T-12, PRD 12.2, FR-P07]
import { z } from 'zod';

export enum ConsentDocumentType {
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY',
  SAFETY_DISCLAIMER = 'SAFETY_DISCLAIMER',
  SENSITIVE_DATA = 'SENSITIVE_DATA', // Weight, mobility, pain collection
}

export const ConsentInput = z.object({
  athleteId: z.string().min(1, 'Athlete ID is required'),
  documentType: z.nativeEnum(ConsentDocumentType),
  grant: z.boolean().describe('Grant consent = true, withdraw = false'),
});

export type ConsentInputType = z.infer<typeof ConsentInput>;

export function validateConsent(input: unknown) {
  return ConsentInput.safeParse(input);
}

// Consent document versions and content [T-12]
export const CONSENT_VERSIONS = {
  TERMS: '2026-08-31',
  PRIVACY: '2026-08-31',
  SAFETY_DISCLAIMER: '2026-08-31',
  SENSITIVE_DATA: '2026-08-31',
};

export const CONSENT_EXPLANATIONS = {
  TERMS: 'Terms of Service for HYROX Coach AI',
  PRIVACY: 'Privacy Policy - how we handle your data',
  SAFETY_DISCLAIMER: 'Important safety notice about training guidance',
  SENSITIVE_DATA:
    'We collect weight and mobility data to personalize your training plan. This is collected securely and never shared with advertisers.',
};
