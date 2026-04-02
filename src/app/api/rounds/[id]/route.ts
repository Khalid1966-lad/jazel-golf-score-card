import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/rounds/[id] - Get a specific round
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const round = await db.round.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            holes: { orderBy: { holeNumber: 'asc' } },
            tees: true,
          },
        },
        scores: {
          orderBy: { holeNumber: 'asc' },
        },
      },
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    return NextResponse.json({ round });
  } catch (error) {
    console.error('Error fetching round:', error);
    return NextResponse.json(
      { error: 'Failed to fetch round' },
      { status: 500 }
    );
  }
}

// PUT /api/rounds/[id] - Update a round
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { scores, notes, weatherTemp, weatherWind, weatherDesc } = body;

    // Update scores
    if (scores && Array.isArray(scores)) {
      for (const score of scores) {
        await db.roundScore.upsert({
          where: {
            roundId_holeNumber: {
              roundId: id,
              holeNumber: score.holeNumber,
            },
          },
          update: {
            strokes: score.strokes,
            putts: score.putts,
            fairwayHit: score.fairwayHit,
            greenInReg: score.greenInReg,
            penalties: score.penalties || 0,
            sandShots: score.sandShots || 0,
            chipShots: score.chipShots || 0,
            driveDistance: score.driveDistance,
          },
          create: {
            roundId: id,
            holeNumber: score.holeNumber,
            strokes: score.strokes,
            putts: score.putts,
            fairwayHit: score.fairwayHit,
            greenInReg: score.greenInReg,
            penalties: score.penalties || 0,
            sandShots: score.sandShots || 0,
            chipShots: score.chipShots || 0,
            driveDistance: score.driveDistance,
          },
        });
      }
    }

    // Calculate totals
    const allScores = await db.roundScore.findMany({
      where: { roundId: id },
    });

    const totalStrokes = allScores.reduce((sum, s) => sum + s.strokes, 0);
    const totalPutts = allScores.reduce((sum, s) => sum + (s.putts || 0), 0);
    const fairwaysHit = allScores.filter((s) => s.fairwayHit).length;
    const fairwaysTotal = allScores.filter((s) => s.fairwayHit !== null).length;
    const greensInReg = allScores.filter((s) => s.greenInReg).length;
    const penalties = allScores.reduce((sum, s) => sum + s.penalties, 0);

    const round = await db.round.update({
      where: { id },
      data: {
        notes,
        weatherTemp,
        weatherWind,
        weatherDesc,
        totalStrokes,
        totalPutts,
        fairwaysHit,
        fairwaysTotal,
        greensInReg,
        penalties,
      },
      include: {
        course: true,
        scores: true,
      },
    });

    return NextResponse.json({ round });
  } catch (error) {
    console.error('Error updating round:', error);
    return NextResponse.json(
      { error: 'Failed to update round' },
      { status: 500 }
    );
  }
}

// DELETE /api/rounds/[id] - Delete a round
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.roundScore.deleteMany({
      where: { roundId: id },
    });
    
    await db.round.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting round:', error);
    return NextResponse.json(
      { error: 'Failed to delete round' },
      { status: 500 }
    );
  }
}
