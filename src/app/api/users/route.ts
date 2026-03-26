import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    // Base where clause - only show non-blocked, non-hidden users
    const baseWhere = {
      blocked: false,
      hiddenFromGolfers: false,
    };

    // If groupId is provided and not 'all', filter by group membership
    const whereClause = groupId && groupId !== 'all' 
      ? {
          ...baseWhere,
          groups: {
            some: {
              groupId: groupId,
            },
          },
        }
      : baseWhere;

    const users = await db.user.findMany({
      where: whereClause,
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
