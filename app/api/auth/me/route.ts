import { getSession } from '@/src/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.athleteId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    await prisma.$disconnect();

    if (!athlete) {
      return Response.json({ error: 'Athlete not found' }, { status: 404 });
    }

    return Response.json({
      id: athlete.id,
      email: athlete.email,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
    });
  } catch (error) {
    console.error('Failed to get user:', error);
    return Response.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
