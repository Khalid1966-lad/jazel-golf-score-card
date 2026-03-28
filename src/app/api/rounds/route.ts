import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper to award achievements inline
async function awardAchievement(userId: string, code: string): Promise<boolean> {
  try {
    const achievement = await db.achievement.findUnique({ where: { code } });
    if (!achievement) return false;
    
    const existing = await db.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } }
    });
    if (existing) return false;
    
    await db.userAchievement.create({
      data: { userId, achievementId: achievement.id }
    });
    return true;
  } catch {
    return false;
  }
}

// Check achievements after round completion
async function checkRoundAchievements(userId: string, score: number, holesPlayed: number) {
  try {
    // Get round count
    const roundCount = await db.round.count({ where: { userId, completed: true } });
    
    // Award round achievements
    if (roundCount >= 1) await awardAchievement(userId, 'first_round');
    if (roundCount >= 5) await awardAchievement(userId, 'rounds_5');
    if (roundCount >= 10) await awardAchievement(userId, 'rounds_10');
    if (roundCount >= 25) await awardAchievement(userId, 'rounds_25');
    if (roundCount >= 50) await awardAchievement(userId, 'rounds_50');
    if (roundCount >= 100) await awardAchievement(userId, 'rounds_100');
    
    // Award score achievements
    if (holesPlayed === 18) {
      if (score < 100) await awardAchievement(userId, 'under_100_18');
      if (score < 90) await awardAchievement(userId, 'under_90_18');
      if (score < 80) await awardAchievement(userId, 'under_80_18');
      if (score <= 72) await awardAchievement(userId, 'par_18');
    } else if (holesPlayed === 9) {
      if (score < 50) await awardAchievement(userId, 'under_50_9');
      if (score < 45) await awardAchievement(userId, 'under_45_9');
      if (score < 40) await awardAchievement(userId, 'under_40_9');
    }
    
    // Check course achievements
    const uniqueCourses = await db.round.findMany({
      where: { userId, completed: true },
      select: { courseId: true },
      distinct: ['courseId'],
    });
    if (uniqueCourses.length >= 3) await awardAchievement(userId, 'courses_3');
    if (uniqueCourses.length >= 5) await awardAchievement(userId, 'courses_5');
    if (uniqueCourses.length >= 10) await awardAchievement(userId, 'courses_10');
    
    // Check home course
    const roundsPerCourse = await db.round.groupBy({
      by: ['courseId'],
      where: { userId, completed: true },
      _count: { id: true },
    });
    if (roundsPerCourse.some(r => r._count.id >= 5)) {
      await awardAchievement(userId, 'home_course');
    }
  } catch (err) {
    console.error('Error checking achievements:', err);
  }
}

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
            tees: true,
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
      playerNames,
      playerScores,
      holesPlayed = 18,
      holesType = null,
    } = body;

    // Build all scores array including main player (index 0) and additional players
    const allScores: Array<{
      holeNumber: number;
      strokes: number;
      putts?: number;
      fairwayHit?: boolean | null;
      greenInReg?: boolean;
      penalties?: number;
      sandShots?: number;
      chipShots?: number;
      driveDistance?: number | null;
      playerIndex: number;
    }> = [];

    // Add main player scores (playerIndex 0)
    scores.forEach((s: {
      holeNumber: number;
      strokes: number;
      putts?: number;
      fairwayHit?: boolean | null;
      greenInReg?: boolean;
      penalties?: number;
      sandShots?: number;
      chipShots?: number;
      driveDistance?: number | null;
    }) => {
      if (s.strokes > 0) {
        allScores.push({
          holeNumber: s.holeNumber,
          strokes: s.strokes,
          putts: s.putts || 0,
          fairwayHit: s.fairwayHit ?? null,
          greenInReg: s.greenInReg || false,
          penalties: s.penalties || 0,
          sandShots: s.sandShots || 0,
          chipShots: s.chipShots || 0,
          driveDistance: s.driveDistance || null,
          playerIndex: 0,
        });
      }
    });

    // Add additional player scores (playerIndex 1, 2, 3, etc.)
    if (playerScores && Array.isArray(playerScores)) {
      playerScores.forEach((ps: {
        playerIndex: number;
        scores: Array<{
          holeNumber: number;
          strokes: number;
          putts?: number;
          fairwayHit?: boolean | null;
          greenInReg?: boolean;
          penalties?: number;
        }>;
      }) => {
        ps.scores.forEach((s) => {
          if (s.strokes > 0) {
            allScores.push({
              holeNumber: s.holeNumber,
              strokes: s.strokes,
              putts: s.putts || 0,
              fairwayHit: s.fairwayHit ?? null,
              greenInReg: s.greenInReg || false,
              penalties: s.penalties || 0,
              playerIndex: ps.playerIndex + 1, // +1 because playerIndex in state is 0-based for additional players
            });
          }
        });
      });
    }

    // Calculate totals from main player only (playerIndex 0)
    const mainPlayerScores = allScores.filter(s => s.playerIndex === 0);
    const totalStrokes = mainPlayerScores.reduce((sum, s) => sum + s.strokes, 0);
    const totalPutts = mainPlayerScores.reduce((sum, s) => sum + (s.putts || 0), 0);
    const fairwaysHit = mainPlayerScores.filter(s => s.fairwayHit === true).length;
    const fairwaysTotal = mainPlayerScores.filter(s => s.fairwayHit !== null).length;
    const greensInReg = mainPlayerScores.filter(s => s.greenInReg).length;
    const penalties = mainPlayerScores.reduce((sum, s) => sum + (s.penalties || 0), 0);

    const round = await db.round.create({
      data: {
        userId,
        courseId,
        teeId,
        weatherTemp,
        weatherWind,
        weatherDesc,
        notes,
        holesPlayed,
        holesType,
        totalStrokes,
        totalPutts,
        fairwaysHit,
        fairwaysTotal,
        greensInReg,
        penalties,
        completed: true,
        playerNames,
        scores: {
          create: allScores,
        },
      },
      include: {
        course: true,
        scores: true,
      },
    });

    // Check and award achievements (non-blocking)
    checkRoundAchievements(userId, totalStrokes, holesPlayed)
      .catch(err => console.error('Error checking achievements:', err));

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
    await db.roundScore.deleteMany({
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
    const { roundId, scores, playerNames, playerScores, teeId, holesPlayed, holesType } = body;

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

    // Build all scores array including main player (index 0) and additional players
    const allScores: Array<{
      holeNumber: number;
      strokes: number;
      putts?: number;
      fairwayHit?: boolean | null;
      greenInReg?: boolean;
      penalties?: number;
      sandShots?: number;
      chipShots?: number;
      driveDistance?: number | null;
      playerIndex: number;
    }> = [];

    // Add main player scores (playerIndex 0)
    scores.forEach((s: {
      holeNumber: number;
      strokes: number;
      putts?: number;
      fairwayHit?: boolean | null;
      greenInReg?: boolean;
      penalties?: number;
      sandShots?: number;
      chipShots?: number;
      driveDistance?: number | null;
    }) => {
      if (s.strokes > 0) {
        allScores.push({
          holeNumber: s.holeNumber,
          strokes: s.strokes,
          putts: s.putts || 0,
          fairwayHit: s.fairwayHit ?? null,
          greenInReg: s.greenInReg || false,
          penalties: s.penalties || 0,
          sandShots: s.sandShots || 0,
          chipShots: s.chipShots || 0,
          driveDistance: s.driveDistance || null,
          playerIndex: 0,
        });
      }
    });

    // Add additional player scores (playerIndex 1, 2, 3, etc.)
    if (playerScores && Array.isArray(playerScores)) {
      playerScores.forEach((ps: {
        playerIndex: number;
        scores: Array<{
          holeNumber: number;
          strokes: number;
          putts?: number;
          fairwayHit?: boolean | null;
          greenInReg?: boolean;
          penalties?: number;
        }>;
      }) => {
        ps.scores.forEach((s) => {
          if (s.strokes > 0) {
            allScores.push({
              holeNumber: s.holeNumber,
              strokes: s.strokes,
              putts: s.putts || 0,
              fairwayHit: s.fairwayHit ?? null,
              greenInReg: s.greenInReg || false,
              penalties: s.penalties || 0,
              playerIndex: ps.playerIndex + 1,
            });
          }
        });
      });
    }

    if (allScores.length === 0) {
      return NextResponse.json(
        { error: 'At least one score with strokes is required' },
        { status: 400 }
      );
    }

    // Calculate totals from main player only (playerIndex 0)
    const mainPlayerScores = allScores.filter(s => s.playerIndex === 0);
    const totalStrokes = mainPlayerScores.reduce((sum, s) => sum + s.strokes, 0);
    const totalPutts = mainPlayerScores.reduce((sum, s) => sum + (s.putts || 0), 0);
    const fairwaysHit = mainPlayerScores.filter(s => s.fairwayHit === true).length;
    const fairwaysTotal = mainPlayerScores.filter(s => s.fairwayHit !== null).length;
    const greensInReg = mainPlayerScores.filter(s => s.greenInReg).length;
    const penalties = mainPlayerScores.reduce((sum, s) => sum + (s.penalties || 0), 0);

    // Delete existing scores
    await db.roundScore.deleteMany({
      where: { roundId },
    });

    // Update the round with new scores
    const updatedRound = await db.round.update({
      where: { id: roundId },
      data: {
        teeId,
        playerNames,
        holesPlayed: holesPlayed || existingRound.holesPlayed,
        holesType: holesType !== undefined ? holesType : existingRound.holesType,
        totalStrokes,
        totalPutts,
        fairwaysHit,
        fairwaysTotal,
        greensInReg,
        penalties,
        scores: {
          create: allScores,
        },
      },
      include: {
        course: true,
        scores: true,
      },
    });

    // Check and award achievements (non-blocking)
    checkRoundAchievements(existingRound.userId, totalStrokes, holesPlayed || existingRound.holesPlayed)
      .catch(err => console.error('Error checking achievements:', err));

    return NextResponse.json({ round: updatedRound });
  } catch (error) {
    console.error('Error updating round:', error);
    return NextResponse.json(
      { error: 'Failed to update round' },
      { status: 500 }
    );
  }
}
