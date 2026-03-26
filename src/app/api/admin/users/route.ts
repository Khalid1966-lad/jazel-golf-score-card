import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all users - admin only
export async function GET(request: NextRequest) {
  try {
    // Check for admin access via session_token
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date() || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
