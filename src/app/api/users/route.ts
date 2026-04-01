import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force recompilation after Prisma client regeneration
// Level definitions - matching the achievement system
const LEVELS = [
  { level: 'Beginner', minPoints: 0, color: 'gray' },
  { level: 'Amateur', minPoints: 100, color: 'green' },
  { level: 'Intermediate', minPoints: 250, color: 'blue' },
  { level: 'Advanced', minPoints: 450, color: 'amber' },
  { level: 'Expert', minPoints: 700, color: 'purple' },
  { level: 'Master', minPoints: 1000, color: 'pink' },
  { level: 'Legend', minPoints: 1500, color: 'orange' },
  { level: 'Immortal', minPoints: 2000, color: 'gold' },
];

// Calculate level from points
function getLevelFromPoints(points: number): { level: string; color: string } {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return { level: LEVELS[i].level, color: LEVELS[i].color };
    }
  }
  return { level: 'Beginner', color: 'gray' };
}

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
        achievements: {
          include: {
            achievement: {
              select: { points: true },
            },
          },
        },
        rounds: {
          where: {
            isShared: true,
            completed: true,
          },
          select: {
            id: true,
            date: true,
            totalStrokes: true,
            totalPutts: true,
            fairwaysHit: true,
            fairwaysTotal: true,
            greensInReg: true,
            penalties: true,
            holesPlayed: true,
            holesType: true,
            course: {
              select: {
                id: true,
                name: true,
                city: true,
                totalHoles: true,
                holes: {
                  select: {
                    holeNumber: true,
                    par: true,
                    handicap: true,
                  },
                  orderBy: { holeNumber: 'asc' },
                },
              },
            },
            scores: {
              where: {
                playerIndex: 0, // Only get the main player's scores (round owner)
              },
              select: {
                holeNumber: true,
                strokes: true,
                putts: true,
                fairwayHit: true,
                greenInReg: true,
                penalties: true,
              },
              orderBy: { holeNumber: 'asc' },
            },
          },
          orderBy: { date: 'desc' },
          take: 1, // Only get the most recent shared round
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate achievement points and level for each user
    const usersWithAchievements = users.map(user => {
      const totalPoints = user.achievements.reduce((sum, a) => sum + a.achievement.points, 0);
      const { level, color } = getLevelFromPoints(totalPoints);
      
      return {
        id: user.id,
        name: user.name,
        handicap: user.handicap,
        avatar: user.avatar,
        city: user.city,
        country: user.country,
        createdAt: user.createdAt,
        _count: user._count,
        achievementPoints: totalPoints,
        achievementLevel: level,
        achievementColor: color,
        lastSharedRound: user.rounds[0] || null,
      };
    });

    return NextResponse.json({ users: usersWithAchievements });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
