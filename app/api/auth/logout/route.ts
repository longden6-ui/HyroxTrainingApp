import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');

    return Response.json({ success: true });
  } catch (error) {
    console.error('Logout failed:', error);
    return Response.json({ error: 'Logout failed' }, { status: 500 });
  }
}
