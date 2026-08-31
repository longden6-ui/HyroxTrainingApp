// Session management [T-11]
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { jwtEncode, jwtDecode } from './jwt';

const prisma = new PrismaClient();
const SESSION_COOKIE = 'hyrox_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export interface Session {
  athleteId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function createSession(athleteId: string, email: string, role: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_MAX_AGE;

  const session: Session = {
    athleteId,
    email,
    role,
    iat: now,
    exp: expiresAt,
  };

  const token = jwtEncode(session);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return null;

    const session = jwtDecode<Session>(token);

    // Check expiration
    if (session.exp < Math.floor(Date.now() / 1000)) {
      clearSession();
      return null;
    }

    return session;
  } catch (err) {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Verify athlete exists and session is valid
export async function verifySession(session: Session): Promise<boolean> {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
    });
    return !!athlete && athlete.email === session.email;
  } catch (err) {
    return false;
  }
}
