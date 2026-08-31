// Auth schema validation tests [T-11]
import { describe, it, expect } from 'vitest';
import { validateSignup, validateSignin, validatePasswordRecovery, validateResetPassword } from './schema';

describe('Auth Schema Validation', () => {
  describe('Signup validation', () => {
    it('accepts valid signup input', () => {
      const result = validateSignup({
        email: 'test@example.com',
        password: 'ValidPass123',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = validateSignup({
        email: 'not-an-email',
        password: 'ValidPass123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without uppercase', () => {
      const result = validateSignup({
        email: 'test@example.com',
        password: 'validpass123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without lowercase', () => {
      const result = validateSignup({
        email: 'test@example.com',
        password: 'VALIDPASS123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without number', () => {
      const result = validateSignup({
        email: 'test@example.com',
        password: 'ValidPassAbc',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password less than 8 characters', () => {
      const result = validateSignup({
        email: 'test@example.com',
        password: 'V1d',
      });
      expect(result.success).toBe(false);
    });

    it('allows optional firstName and lastName', () => {
      const result = validateSignup({
        email: 'test@example.com',
        password: 'ValidPass123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Signin validation', () => {
    it('accepts valid signin input', () => {
      const result = validateSignin({
        email: 'test@example.com',
        password: 'ValidPass123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = validateSignin({
        email: 'not-an-email',
        password: 'ValidPass123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing password', () => {
      const result = validateSignin({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Password recovery validation', () => {
    it('accepts valid email', () => {
      const result = validatePasswordRecovery({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = validatePasswordRecovery({
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Reset password validation', () => {
    it('accepts valid reset input', () => {
      const result = validateResetPassword({
        token: 'valid-token-here',
        newPassword: 'NewPass123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing token', () => {
      const result = validateResetPassword({
        token: '',
        newPassword: 'NewPass123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without uppercase', () => {
      const result = validateResetPassword({
        token: 'valid-token',
        newPassword: 'newpass123',
      });
      expect(result.success).toBe(false);
    });
  });
});
