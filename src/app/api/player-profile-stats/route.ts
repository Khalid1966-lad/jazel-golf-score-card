import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Level thresholds matching achievements route
const LEVELS = [
  { level: 'Beginner', minPoints: 0 },
  { level: 'Amateur', minPoints: 100 },
  { level: 'Intermediate', minPoints: 250 },
  { level: 'Advanced', minPoints: 450 },
  { level: 'Expert', minPoints: 700 },
  { level: 'Master', minPoints: 1000 },
  { level: 'Legend', minPoints: 1500 },
  { level: 'Immortal', minPoints: 2000 },
];

function getLevel(totalPoints: number) {
  let level = 'Beginner';
  let nextLevel = 'Amateur';
  let pointsToNext = 100 - totalPoints;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVELS[i].minPoints) {
      level = LEVELS[i].level;
      if (i < LEVELS.length - 1) {
        nextLevel = LEVELS[i + 1].level;
        pointsToNext = LEVELS[i + 1].minPoints - totalPoints;
      } else {
        nextLevel = 'Max Level!';
        pointsToNext = 0;
      }
      break;
    }
  }

  return { level, nextLevel, pointsToNext: Math.max(0, pointsToNext) };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');
    const currentUserId = searchParams.get('currentUserId');

    if (!targetUserId || !currentUserId) {
      return NextResponse.json(
        { error: 'targetUserId and currentUserId are required' },
        { status: 400 }
      );
    }

    // --- Times played together (only from current user's rounds) ---
    const myRounds = await db.round.findMany({
      where: {
        userId: currentUserId,
        playerNames: { not: null },
      },
      select: { id: true, playerNames: true },
    });

    let timesPlayedTogether = 0;

    // Count from current user's rounds: check if targetUserId appears in playerNames JSON
    for (const round of myRounds) {
      if (round.playerNames) {
        try {
          const players: Array<{ userId?: string | null }> = JSON.parse(round.playerNames);
          if (players.some((p) => p.userId === targetUserId)) {
            timesPlayedTogether++;
          }
        } catch {}
      }
    }

    // --- Achievement points and level for the target user ---
    const userAchievements = await db.userAchievement.findMany({
      where: { userId: targetUserId },
      include: { achievement: true },
    });

    const totalPoints = userAchievements.reduce(
      (sum, ua) => sum + ua.achievement.points,
      0
    );
    const earnedCount = userAchievements.length;
    const { level, nextLevel, pointsToNext } = getLevel(totalPoints);

    return NextResponse.json({
      timesPlayedTogether,
      totalPoints,
      earnedCount,
      level,
      nextLevel,
      pointsToNext,
    });
  } catch (error) {
    console.error('Error fetching player profile stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats', details: String(error) },
      { status: 500 }
    );
  }
}
