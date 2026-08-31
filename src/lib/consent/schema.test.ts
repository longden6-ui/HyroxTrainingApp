// Consent schema validation tests [T-12]
import { describe, it, expect } from 'vitest';
import { validateConsent, ConsentDocumentType } from './schema';

describe('Consent Schema Validation', () => {
  it('accepts valid consent input', () => {
    const result = validateConsent({
      athleteId: 'athlete-123',
      documentType: ConsentDocumentType.TERMS,
      grant: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts all document types', () => {
    Object.values(ConsentDocumentType).forEach((documentType) => {
      const result = validateConsent({
        athleteId: 'athlete-123',
        documentType,
        grant: true,
      });
      expect(result.success).toBe(true);
    });
  });

  it('rejects missing athleteId', () => {
    const result = validateConsent({
      documentType: ConsentDocumentType.TERMS,
      grant: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid documentType', () => {
    const result = validateConsent({
      athleteId: 'athlete-123',
      documentType: 'INVALID_TYPE',
      grant: true,
    });
    expect(result.success).toBe(false);
  });

  it('accepts both grant=true and grant=false', () => {
    const grant = validateConsent({
      athleteId: 'athlete-123',
      documentType: ConsentDocumentType.PRIVACY,
      grant: true,
    });
    expect(grant.success).toBe(true);

    const withdraw = validateConsent({
      athleteId: 'athlete-123',
      documentType: ConsentDocumentType.PRIVACY,
      grant: false,
    });
    expect(withdraw.success).toBe(true);
  });
});
