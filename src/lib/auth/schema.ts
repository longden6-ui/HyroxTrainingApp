// Authentication schema validation [T-11, PRD 9.6]
import { z } from 'zod';

export const SignupInput = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

export const SigninInput = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const PasswordRecoveryInput = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordInput = z.object({
  token: z.string().min(1, 'Recovery token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type SignupInputType = z.infer<typeof SignupInput>;
export type SigninInputType = z.infer<typeof SigninInput>;
export type PasswordRecoveryInputType = z.infer<typeof PasswordRecoveryInput>;
export type ResetPasswordInputType = z.infer<typeof ResetPasswordInput>;

export function validateSignup(input: unknown) {
  return SignupInput.safeParse(input);
}

export function validateSignin(input: unknown) {
  return SigninInput.safeParse(input);
}

export function validatePasswordRecovery(input: unknown) {
  return PasswordRecoveryInput.safeParse(input);
}

export function validateResetPassword(input: unknown) {
  return ResetPasswordInput.safeParse(input);
}
