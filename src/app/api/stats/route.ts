import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all rounds with scores for the user
    const rounds = await db.round.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            holes: true,
          },
        },
        scores: {
          where: { playerIndex: 0 }, // Only main player scores
        },
      },
    });

    // Initialize counters
    let totalHoles = 0;
    let eagles = 0; // 2 under par
    let birdies = 0; // 1 under par
    let pars = 0; // even par
    let bogeys = 0; // 1 over par
    let doubleBogeys = 0; // 2 over par
    let tripleOrWorse = 0; // 3+ over par

    // Calculate statistics
    rounds.forEach((round) => {
      const holeParMap = new Map(
        round.course.holes.map((h) => [h.holeNumber, h.par])
      );

      round.scores.forEach((score) => {
        if (score.strokes > 0) {
          const par = holeParMap.get(score.holeNumber) || 4;
          const diff = score.strokes - par;
          totalHoles++;

          if (diff <= -2) {
            eagles++;
          } else if (diff === -1) {
            birdies++;
          } else if (diff === 0) {
            pars++;
          } else if (diff === 1) {
            bogeys++;
          } else if (diff === 2) {
            doubleBogeys++;
          } else {
            tripleOrWorse++;
          }
        }
      });
    });

    // Calculate average statistics
    const totalStrokes = rounds.reduce((sum, r) => sum + (r.totalStrokes || 0), 0);
    const totalPutts = rounds.reduce((sum, r) => sum + (r.totalPutts || 0), 0);
    const fairwaysHit = rounds.reduce((sum, r) => sum + (r.fairwaysHit || 0), 0);
    const fairwaysTotal = rounds.reduce((sum, r) => sum + (r.fairwaysTotal || 0), 0);
    const greensInReg = rounds.reduce((sum, r) => sum + (r.greensInReg || 0), 0);
    const totalPenalties = rounds.reduce((sum, r) => sum + (r.penalties || 0), 0);

    const stats = {
      totalRounds: rounds.length,
      totalHoles,
      scoring: {
        eagles,
        birdies,
        pars,
        bogeys,
        doubleBogeys,
        tripleOrWorse,
      },
      averages: {
        strokes: rounds.length > 0 ? Math.round(totalStrokes / rounds.length) : 0,
        putts: rounds.length > 0 ? (totalPutts / rounds.length).toFixed(1) : '0',
        fairwayPercentage: fairwaysTotal > 0 ? Math.round((fairwaysHit / fairwaysTotal) * 100) : 0,
        girPercentage: totalHoles > 0 ? Math.round((greensInReg / totalHoles) * 100) : 0,
        penaltiesPerRound: rounds.length > 0 ? (totalPenalties / rounds.length).toFixed(1) : '0',
      },
      percentages: {
        eagles: totalHoles > 0 ? Math.round((eagles / totalHoles) * 100) : 0,
        birdies: totalHoles > 0 ? Math.round((birdies / totalHoles) * 100) : 0,
        pars: totalHoles > 0 ? Math.round((pars / totalHoles) * 100) : 0,
        bogeys: totalHoles > 0 ? Math.round((bogeys / totalHoles) * 100) : 0,
        doubleBogeys: totalHoles > 0 ? Math.round((doubleBogeys / totalHoles) * 100) : 0,
        tripleOrWorse: totalHoles > 0 ? Math.round((tripleOrWorse / totalHoles) * 100) : 0,
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
