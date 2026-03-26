import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    // Find session
    const session = await db.adminSession.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      // Session expired or not found
      if (session) {
        await db.adminSession.delete({ where: { token } });
      }
      return NextResponse.json({ user: null });
    }

    // Check if user is blocked
    if (session.user.blocked) {
      await db.adminSession.delete({ where: { token } });
      return NextResponse.json({ user: null });
    }

    // Return user without password
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        handicap: session.user.handicap,
        isAdmin: session.user.isAdmin,
        avatar: session.user.avatar,
        city: session.user.city,
        country: session.user.country,
        nearbyDistance: session.user.nearbyDistance,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ user: null });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (token) {
      await db.adminSession.deleteMany({
        where: { token },
      });
    }

    cookieStore.delete('session_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
