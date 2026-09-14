// app/api/auth/mfa/enroll/route.ts
// POST → generates a TOTP secret and returns the otpauth:// URI for QR rendering
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/src/lib/auth/session'
import { generateMfaSecret, encryptSecret, generateOtpAuthUri } from '@/src/lib/mfa'

const prisma = new PrismaClient()

export async function POST() {
  try {
    const session = await getSession()
    if (!session?.athleteId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const plainSecret = generateMfaSecret()
    const encryptedSecret = encryptSecret(plainSecret)

    await prisma.athlete.update({
      where: { id: session.athleteId },
      data: { mfaSecret: encryptedSecret, mfaPending: true, mfaEnabled: false },
    })

    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      select: { email: true },
    })

    const otpAuthUri = generateOtpAuthUri(athlete!.email, plainSecret)

    return Response.json({ otpAuthUri, secret: plainSecret })
  } catch (error) {
    console.error('MFA enroll error:', error)
    return Response.json({ error: 'Enrollment failed' }, { status: 500 })
  }
}
