// app/api/auth/mfa/route.ts
// DELETE { code } → verifies TOTP then disables MFA
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/src/lib/auth/session'
import { verifyTotp } from '@/src/lib/mfa'

const prisma = new PrismaClient()

export async function DELETE(req: Request) {
  try {
    const session = await getSession()
    if (!session?.athleteId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code || !/^\d{6}$/.test(code)) {
      return Response.json({ error: 'A 6-digit authenticator code is required' }, { status: 400 })
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      select: { mfaEnabled: true, mfaSecret: true },
    })

    if (!athlete?.mfaEnabled || !athlete.mfaSecret) {
      return Response.json({ error: 'MFA is not enabled on this account' }, { status: 400 })
    }

    const valid = await verifyTotp(code, athlete.mfaSecret)
    if (!valid) {
      return Response.json({ error: 'Invalid code. Please try again.' }, { status: 401 })
    }

    await prisma.athlete.update({
      where: { id: session.athleteId },
      data: { mfaEnabled: false, mfaPending: false, mfaSecret: null, mfaBackupCodes: [] },
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('MFA disable error:', error)
    return Response.json({ error: 'Failed to disable MFA' }, { status: 500 })
  }
}
