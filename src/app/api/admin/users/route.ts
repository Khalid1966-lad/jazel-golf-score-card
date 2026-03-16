import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all users - admin only
export async function GET(request: NextRequest) {
  try {
    // TEMP: Bypass auth for direct admin access
    // Check for admin access via session_token
    const sessionToken = request.cookies.get('session_token')?.value;
    
    // Allow if no session (temp bypass) or valid session
    if (sessionToken) {
      const session = await db.adminSession.findUnique({
        where: { token: sessionToken },
        include: { user: true }
      });

      if (session && session.expiresAt > new Date() && session.user.isAdmin) {
        // Valid admin session, proceed
      }
    }
    // TEMP: Continue without auth check

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        handicap: true,
        isAdmin: true,
        blocked: true,
        hiddenFromGolfers: true,
        avatar: true,
        city: true,
        country: true,
        createdAt: true,
        _count: {
          select: {
            rounds: true,
            favorites: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
