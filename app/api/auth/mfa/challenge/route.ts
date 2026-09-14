// app/api/auth/mfa/challenge/route.ts
// POST { mfaToken, code } → verifies MFA and issues a session cookie
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyMfaToken } from '@/src/lib/mfa'
import { verifyTotp, verifyAndConsumeBackupCode } from '@/src/lib/mfa'
import { createSession } from '@/src/lib/auth/session'

const prisma = new PrismaClient()

// Per-token rate limit: max 5 attempts per mfa_token (keyed by sub:iat)
const attempts = new Map<string, number>()

export async function POST(req: NextRequest) {
  try {
    const { mfaToken, code } = await req.json()

    if (!mfaToken || !code) {
      return Response.json({ error: 'Missing mfaToken or code' }, { status: 400 })
    }

    // Verify and decode the short-lived MFA token
    let payload
    try {
      payload = verifyMfaToken(mfaToken)
    } catch {
      return Response.json({ error: 'Invalid or expired MFA token. Please sign in again.' }, { status: 401 })
    }

    const attemptKey = `${payload.sub}:${payload.iat}`
    const currentAttempts = attempts.get(attemptKey) ?? 0

    if (currentAttempts >= 5) {
      return Response.json({ error: 'Too many attempts. Please sign in again.' }, { status: 429 })
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: payload.sub },
    })

    if (!athlete || !athlete.mfaEnabled || !athlete.mfaSecret) {
      return Response.json({ error: 'MFA not configured for this account' }, { status: 400 })
    }

    const isTotpCode = /^\d{6}$/.test(code)
    const isBackupCode = /^[A-F0-9]{6}-[A-F0-9]{6}$/i.test(code)

    if (!isTotpCode && !isBackupCode) {
      return Response.json({ error: 'Invalid code format' }, { status: 400 })
    }

    let valid = false

    if (isTotpCode) {
      valid = await verifyTotp(code, athlete.mfaSecret)
    } else {
      // Backup code
      const idx = await verifyAndConsumeBackupCode(code, athlete.mfaBackupCodes)
      if (idx >= 0) {
        valid = true
        // Consume the backup code
        const updated = [...athlete.mfaBackupCodes]
        updated[idx] = '' // blank out the used slot
        await prisma.athlete.update({
          where: { id: athlete.id },
          data: { mfaBackupCodes: updated },
        })
      }
    }

    if (!valid) {
      attempts.set(attemptKey, currentAttempts + 1)
      return Response.json({ error: 'Invalid code. Please try again.' }, { status: 401 })
    }

    // Success — clear rate limit and issue session
    attempts.delete(attemptKey)

    await createSession(athlete.id, athlete.email, athlete.role.toString())

    return Response.json({ success: true })
  } catch (error) {
    console.error('MFA challenge error:', error)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
