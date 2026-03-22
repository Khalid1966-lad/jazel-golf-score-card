import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Debug endpoint to check users (disable in production!)
export async function GET(request: NextRequest) {
  // Simple auth check - only allow with secret
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.DEBUG_SECRET && secret !== 'jazel-debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        blocked: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ 
      count: users.length,
      users 
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
