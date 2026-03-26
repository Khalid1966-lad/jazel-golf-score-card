import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = await db.user.findMany({
      where: {
        blocked: false,
        hiddenFromGolfers: false,
      },
      select: {
        id: true,
        name: true,
        handicap: true,
        avatar: true,
        city: true,
        country: true,
        createdAt: true,
        _count: {
          select: {
            rounds: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
