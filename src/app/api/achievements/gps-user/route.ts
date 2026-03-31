import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Award GPS User badge when user opens the course map
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Find the GPS User achievement
    const achievement = await db.achievement.findUnique({
      where: { code: 'gps_user' },
    });

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    // Check if user already has this badge
    const existing = await db.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ alreadyAwarded: true, message: 'GPS User badge already earned' });
    }

    // Award the badge
    await db.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
    });

    return NextResponse.json({
      success: true,
      awarded: true,
      message: 'GPS User badge earned!',
      achievement: {
        code: achievement.code,
        name: achievement.name,
        points: achievement.points,
      },
    });
  } catch (error) {
    console.error('Error awarding GPS User badge:', error);
    return NextResponse.json(
      { error: 'Failed to award badge' },
      { status: 500 }
    );
  }
}
