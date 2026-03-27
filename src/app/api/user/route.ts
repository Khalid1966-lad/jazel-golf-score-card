import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/user - Get user profile
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (!email && !id) {
      return NextResponse.json(
        { error: 'Email or ID is required' },
        { status: 400 }
      );
    }

    const user = email
      ? await db.user.findUnique({
          where: { email },
          include: {
            clubDistances: true,
            rounds: {
              include: { course: true },
              orderBy: { date: 'desc' },
              take: 10,
            },
          },
        })
      : await db.user.findUnique({
          where: { id },
          include: {
            clubDistances: true,
            rounds: {
              include: { course: true },
              orderBy: { date: 'desc' },
              take: 10,
            },
          },
        });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate statistics
    const rounds = await db.round.findMany({
      where: { userId: user.id, completed: true },
    });

    const stats = {
      totalRounds: rounds.length,
      averageScore: rounds.length > 0
        ? Math.round(rounds.reduce((sum, r) => sum + (r.totalStrokes || 0), 0) / rounds.length)
        : 0,
      averagePutts: rounds.length > 0
        ? Math.round(rounds.reduce((sum, r) => sum + (r.totalPutts || 0), 0) / rounds.length)
        : 0,
      fairwayPercentage: rounds.length > 0
        ? Math.round(
            (rounds.reduce((sum, r) => sum + (r.fairwaysHit || 0), 0) /
              rounds.reduce((sum, r) => sum + (r.fairwaysTotal || 1), 0)) *
              100
          )
        : 0,
      averageGIR: rounds.length > 0
        ? Math.round(rounds.reduce((sum, r) => sum + (r.greensInReg || 0), 0) / rounds.length)
        : 0,
      bestScore: rounds.length > 0
        ? Math.min(...rounds.map((r) => r.totalStrokes || Infinity))
        : null,
    };

    return NextResponse.json({ user, stats });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/user - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, handicap, homeCourseId, avatar } = body;

    const user = await db.user.update({
      where: { id },
      data: {
        name,
        handicap,
        homeCourseId,
        avatar,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
