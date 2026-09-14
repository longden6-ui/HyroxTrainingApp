// app/api/auth/mfa/confirm/route.ts
// POST { code } → verifies TOTP during enrollment, activates MFA, returns backup codes
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/src/lib/auth/session'
import { verifyTotp, generateBackupCodes } from '@/src/lib/mfa'

const prisma = new PrismaClient()

// Per-user rate limit during enrollment: 5 attempts per 10 min
const enrollAttempts = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session?.athleteId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code || !/^\d{6}$/.test(code)) {
      return Response.json({ error: 'A 6-digit code is required' }, { status: 400 })
    }

    // Rate limit
    const now = Date.now()
    const rl = enrollAttempts.get(session.athleteId)
    if (rl && rl.resetAt > now && rl.count >= 5) {
      return Response.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 })
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      select: { mfaSecret: true, mfaPending: true },
    })

    if (!athlete?.mfaPending || !athlete.mfaSecret) {
      return Response.json({ error: 'No pending MFA enrollment found' }, { status: 400 })
    }

    const valid = await verifyTotp(code, athlete.mfaSecret)

    if (!valid) {
      const existing = enrollAttempts.get(session.athleteId)
      enrollAttempts.set(session.athleteId, {
        count: (existing?.count ?? 0) + 1,
        resetAt: existing?.resetAt ?? (now + 10 * 60 * 1000),
      })
      return Response.json({ error: 'Invalid code. Check your authenticator app and try again.' }, { status: 401 })
    }

    // Generate backup codes
    const pairs = await generateBackupCodes()
    const hashedCodes = pairs.map((p) => p.hashed)
    const plainCodes = pairs.map((p) => p.plain)

    await prisma.athlete.update({
      where: { id: session.athleteId },
      data: { mfaEnabled: true, mfaPending: false, mfaBackupCodes: hashedCodes },
    })

    enrollAttempts.delete(session.athleteId)

    return Response.json({ backupCodes: plainCodes })
  } catch (error) {
    console.error('MFA confirm error:', error)
    return Response.json({ error: 'Confirmation failed' }, { status: 500 })
  }
}
