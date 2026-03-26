import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/rounds - Get user's rounds
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const where: { userId: string; courseId?: string } = { userId };
    if (courseId) where.courseId = courseId;

    const rounds = await db.round.findMany({
      where,
      include: {
        course: {
          include: {
            holes: { orderBy: { holeNumber: 'asc' } },
          },
        },
        scores: {
          orderBy: { holeNumber: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ rounds });
  } catch (error) {
    console.error('Error fetching rounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rounds' },
      { status: 500 }
    );
  }
}

// POST /api/rounds - Create a new round
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      courseId,
      teeId,
      weatherTemp,
      weatherWind,
      weatherDesc,
      notes,
      scores,
    } = body;

    // Calculate totals
    const totalStrokes = scores.reduce((sum: number, s: { strokes: number }) => sum + s.strokes, 0);
    const totalPutts = scores.reduce((sum: number, s: { putts: number }) => sum + (s.putts || 0), 0);
    const fairwaysHit = scores.filter((s: { fairwayHit: boolean }) => s.fairwayHit).length;
    const fairwaysTotal = scores.filter((s: { fairwayHit: boolean | null }) => s.fairwayHit !== null).length;
    const greensInReg = scores.filter((s: { greenInReg: boolean }) => s.greenInReg).length;
    const penalties = scores.reduce((sum: number, s: { penalties: number }) => sum + (s.penalties || 0), 0);

    const round = await db.round.create({
      data: {
        userId,
        courseId,
        teeId,
        weatherTemp,
        weatherWind,
        weatherDesc,
        notes,
        totalStrokes,
        totalPutts,
        fairwaysHit,
        fairwaysTotal,
        greensInReg,
        penalties,
        completed: true,
        scores: {
          create: scores.map((s: {
            holeNumber: number;
            strokes: number;
            putts?: number;
            fairwayHit?: boolean;
            greenInReg?: boolean;
            penalties?: number;
            sandShots?: number;
            chipShots?: number;
            driveDistance?: number;
          }) => ({
            holeNumber: s.holeNumber,
            strokes: s.strokes,
            putts: s.putts,
            fairwayHit: s.fairwayHit,
            greenInReg: s.greenInReg,
            penalties: s.penalties || 0,
            sandShots: s.sandShots || 0,
            chipShots: s.chipShots || 0,
            driveDistance: s.driveDistance,
          })),
        },
      },
      include: {
        course: true,
        scores: true,
      },
    });

    return NextResponse.json({ round });
  } catch (error) {
    console.error('Error creating round:', error);
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    );
  }
}

// DELETE /api/rounds - Delete a round
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roundId = searchParams.get('roundId');

    if (!roundId) {
      return NextResponse.json(
        { error: 'Round ID is required' },
        { status: 400 }
      );
    }

    // Delete scores first (due to foreign key constraint)
    await db.score.deleteMany({
      where: { roundId },
    });

    // Delete the round
    await db.round.delete({
      where: { id: roundId },
    });

    return NextResponse.json({ success: true, message: 'Round deleted' });
  } catch (error) {
    console.error('Error deleting round:', error);
    return NextResponse.json(
      { error: 'Failed to delete round' },
      { status: 500 }
    );
  }
}

// PUT /api/rounds - Update a round
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { roundId, scores } = body;

    if (!roundId) {
      return NextResponse.json(
        { error: 'Round ID is required' },
        { status: 400 }
      );
    }

    // Get the existing round
    const existingRound = await db.round.findUnique({
      where: { id: roundId },
      include: { scores: true },
    });

    if (!existingRound) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    // Calculate new totals
    const totalStrokes = scores.reduce((sum: number, s: { strokes: number }) => sum + s.strokes, 0);
    const totalPutts = scores.reduce((sum: number, s: { putts: number }) => sum + (s.putts || 0), 0);
    const fairwaysHit = scores.filter((s: { fairwayHit: boolean }) => s.fairwayHit).length;
    const fairwaysTotal = scores.filter((s: { fairwayHit: boolean | null }) => s.fairwayHit !== null).length;
    const greensInReg = scores.filter((s: { greenInReg: boolean }) => s.greenInReg).length;
    const penalties = scores.reduce((sum: number, s: { penalties: number }) => sum + (s.penalties || 0), 0);

    // Delete existing scores and create new ones
    await db.score.deleteMany({
      where: { roundId },
    });

    // Update the round with new scores
    const updatedRound = await db.round.update({
      where: { id: roundId },
      data: {
        totalStrokes,
        totalPutts,
        fairwaysHit,
        fairwaysTotal,
        greensInReg,
        penalties,
        scores: {
          create: scores.map((s: {
            holeNumber: number;
            strokes: number;
            putts?: number;
            fairwayHit?: boolean | null;
            greenInReg?: boolean;
            penalties?: number;
          }) => ({
            holeNumber: s.holeNumber,
            strokes: s.strokes,
            putts: s.putts || 0,
            fairwayHit: s.fairwayHit ?? null,
            greenInReg: s.greenInReg || false,
            penalties: s.penalties || 0,
          })),
        },
      },
      include: {
        course: true,
        scores: true,
      },
    });

    return NextResponse.json({ round: updatedRound });
  } catch (error) {
    console.error('Error updating round:', error);
    return NextResponse.json(
      { error: 'Failed to update round' },
      { status: 500 }
    );
  }
}
