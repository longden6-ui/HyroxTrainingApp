// src/lib/mfa.ts — TOTP + backup code utilities for HYROX Coach AI
import crypto from 'crypto'
import { generateSecret, generateURI, verify } from 'otplib'
import bcrypt from 'bcryptjs'

// ── Env validation ────────────────────────────────────────────────────────────
// MFA_ENCRYPTION_KEY: 64-char hex string (32 bytes) for AES-256-GCM
// MFA_TOKEN_SECRET: any string, used to sign short-lived mfa_challenge JWTs

function getEncryptionKey(): Buffer {
  const hex = process.env.MFA_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('MFA_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

// ── Secret encryption/decryption (AES-256-GCM) ───────────────────────────────

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptSecret(stored: string): string {
  const key = getEncryptionKey()
  const [ivHex, tagHex, encHex] = stored.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(encHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final('utf8')
}

// ── TOTP ──────────────────────────────────────────────────────────────────────

const TOTP_EPOCH_TOLERANCE = 30 // ±30s clock drift tolerance

export function generateMfaSecret(): string {
  return generateSecret({ length: 20 }) // 160-bit
}

export function generateOtpAuthUri(email: string, plainSecret: string): string {
  return generateURI({ issuer: 'HYROX Coach AI', label: email, secret: plainSecret })
}

export async function verifyTotp(code: string, encryptedSecret: string): Promise<boolean> {
  try {
    const plain = decryptSecret(encryptedSecret)
    const result = await verify({ token: code, secret: plain, epochTolerance: TOTP_EPOCH_TOLERANCE })
    return result.valid
  } catch {
    return false
  }
}

// ── Backup codes ──────────────────────────────────────────────────────────────

export interface BackupCodePair {
  plain: string   // shown once to the user  (e.g. "A1B2C3-D4E5F6")
  hashed: string  // stored in the database
}

function randomBackupCode(): string {
  const part = () => crypto.randomBytes(3).toString('hex').toUpperCase()
  return `${part()}-${part()}`
}

export async function generateBackupCodes(): Promise<BackupCodePair[]> {
  const pairs: BackupCodePair[] = []
  for (let i = 0; i < 10; i++) {
    const plain = randomBackupCode()
    const hashed = await bcrypt.hash(plain, 10)
    pairs.push({ plain, hashed })
  }
  return pairs
}

/** Returns the array index of the matched code, or -1 if none matched. */
export async function verifyAndConsumeBackupCode(
  submitted: string,
  storedHashed: string[],
): Promise<number> {
  for (let i = 0; i < storedHashed.length; i++) {
    if (!storedHashed[i]) continue // already consumed
    const match = await bcrypt.compare(submitted.toUpperCase(), storedHashed[i])
    if (match) return i
  }
  return -1
}

// ── MFA token signing (short-lived JWT for challenge step) ───────────────────

const MFA_TOKEN_SECRET = process.env.MFA_TOKEN_SECRET || 'mfa-dev-secret-change-me'

function b64url(data: string): string {
  return Buffer.from(data, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64urlDec(data: string): string {
  const padded = data + '='.repeat((4 - (data.length % 4)) % 4)
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

export interface MfaTokenPayload {
  sub: string   // athleteId
  purpose: 'mfa_challenge'
  iat: number
  exp: number
}

export function signMfaToken(athleteId: string): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: MfaTokenPayload = { sub: athleteId, purpose: 'mfa_challenge', iat: now, exp: now + 300 }
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', MFA_TOKEN_SECRET)
    .update(`${header}.${body}`).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${body}.${sig}`
}

export function verifyMfaToken(token: string): MfaTokenPayload {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid MFA token')
  const expectedSig = crypto.createHmac('sha256', MFA_TOKEN_SECRET)
    .update(`${parts[0]}.${parts[1]}`).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  if (parts[2] !== expectedSig) throw new Error('Invalid MFA token signature')
  const payload = JSON.parse(b64urlDec(parts[1])) as MfaTokenPayload
  if (payload.purpose !== 'mfa_challenge') throw new Error('Wrong token purpose')
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('MFA token expired')
  return payload
}
