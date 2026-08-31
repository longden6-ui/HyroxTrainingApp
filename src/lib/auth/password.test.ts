// Password hashing tests [T-11]
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('Password Hashing', () => {
  it('hashes a password', async () => {
    const password = 'MySecurePassword123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies correct password', async () => {
    const password = 'MySecurePassword123';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('rejects incorrect password', async () => {
    const password = 'MySecurePassword123';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword('WrongPassword456', hash);
    expect(isValid).toBe(false);
  });

  it('produces different hashes for same password', async () => {
    const password = 'MySecurePassword123';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
  });
});
