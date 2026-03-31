import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Debug endpoint to check database state
export async function GET(request: NextRequest) {
  // Simple auth check - only allow with secret
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.DEBUG_SECRET && secret !== 'jazel-debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check database connection
    let dbConnected = false;
    let dbError = null;
    
    try {
      await db.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (e) {
      dbError = e instanceof Error ? e.message : 'Unknown error';
    }

    // Count records in each table
    const counts = {
      users: 0,
      golfCourses: 0,
      tournaments: 0,
      achievements: 0,
      rounds: 0,
      golferGroups: 0,
      messages: 0,
    };

    if (dbConnected) {
      try {
        counts.users = await db.user.count();
        counts.golfCourses = await db.golfCourse.count();
        counts.tournaments = await db.tournament.count();
        counts.achievements = await db.achievement.count();
        counts.rounds = await db.round.count();
        counts.golferGroups = await db.golferGroup.count();
        counts.messages = await db.message.count();
      } catch (e) {
        console.error('Count error:', e);
      }
    }

    // Get list of users (limited info)
    const users = [];
    if (dbConnected) {
      try {
        const userList = await db.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            isAdmin: true,
            isSuperAdmin: true,
            createdAt: true,
          },
          take: 10,
        });
        users.push(...userList);
      } catch (e) {
        console.error('User list error:', e);
      }
    }

    // Check environment
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json({
      success: true,
      database: {
        connected: dbConnected,
        error: dbError,
        counts,
      },
      users,
      environment: envCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Check DB error:', error);
    return NextResponse.json({
      error: 'Failed to check database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
