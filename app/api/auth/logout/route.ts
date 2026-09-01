import { clearSession } from '@/src/lib/auth/session';

export async function POST() {
  try {
    await clearSession();
    return Response.json({ success: true });
  } catch (error) {
    console.error('Logout failed:', error);
    return Response.json({ error: 'Logout failed' }, { status: 500 });
  }
}
