import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/tournaments/scoring - Start live scoring for a group
// Creates a TournamentScoringRound and a linked Round
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, groupLetter, scorerId } = body;

    if (!tournamentId || !groupLetter || !scorerId) {
      return NextResponse.json(
        { error: 'tournamentId, groupLetter, and scorerId are required' },
        { status: 400 }
      );
    }

    // Verify the tournament exists and is in progress
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        course: {
          include: { holes: { orderBy: { holeNumber: 'asc' } } },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Tournament must be in progress to start scoring' },
        { status: 400 }
      );
    }

    // Check if there's already an active scoring round for this group
    const existingScoring = await db.tournamentScoringRound.findUnique({
      where: { tournamentId_groupLetter: { tournamentId, groupLetter } },
    });

    if (existingScoring && existingScoring.status === 'active') {
      // Return the existing scoring round
      const existingRound = await db.round.findUnique({
        where: { id: existingScoring.roundId },
        include: { scores: true },
      });
      return NextResponse.json({
        scoringRound: existingScoring,
        round: existingRound,
        tournament,
        message: 'Active scoring round already exists for this group',
      });
    }

    // Get all participants in this group
    const participants = await db.tournamentParticipant.findMany({
      where: { tournamentId, groupLetter },
      include: { user: { select: { id: true, name: true, handicap: true, avatar: true } } },
      orderBy: { positionInGroup: 'asc' },
    });

    if (participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants in this group' },
        { status: 400 }
      );
    }

    // Verify scorer is in this group and is designated as scorer
    const scorerParticipant = participants.find(p => p.userId === scorerId);
    if (!scorerParticipant) {
      return NextResponse.json(
        { error: 'Scorer must be a participant in this group' },
        { status: 400 }
      );
    }
    if (!scorerParticipant.isScorer) {
      return NextResponse.json(
        { error: 'Only designated scorers can start scoring. Contact the tournament admin.' },
        { status: 403 }
      );
    }

    // Build additional players list (all group members except scorer)
    const scorer = participants.find(p => p.userId === scorerId)!;
    const otherPlayers = participants.filter(p => p.userId !== scorerId);

    // Create the Round record (scorer is the main player)
    const round = await db.round.create({
      data: {
        userId: scorerId,
        courseId: tournament.courseId,
        holesPlayed: 18,
        holesType: null,
        playerNames: JSON.stringify(
          otherPlayers.map(p => ({
            id: p.userId,
            name: p.user.name || 'Unknown',
            avatar: p.user.avatar,
            handicap: p.user.handicap,
            userId: p.userId,
          }))
        ),
        playerHandicap: scorer.user.handicap || null,
        completed: false,
        tournamentId,
        tournamentGroupLetter: groupLetter,
        scores: {
          create: tournament.course.holes.flatMap(hole =>
            // Main player scores (playerIndex 0) for all holes
            [
              {
                holeNumber: hole.holeNumber,
                strokes: 0,
                putts: 0,
                playerIndex: 0,
              },
              // Additional player scores (playerIndex 1, 2, 3...)
              ...otherPlayers.map((_, idx) => ({
                holeNumber: hole.holeNumber,
                strokes: 0,
                putts: 0,
                playerIndex: idx + 1,
              })),
            ]
          ),
        },
      },
      include: { scores: true },
    });

    // Create the TournamentScoringRound link
    const scoringRound = await db.tournamentScoringRound.create({
      data: {
        tournamentId,
        groupLetter,
        scorerId,
        roundId: round.id,
        status: 'active',
        currentHole: 1,
      },
    });

    // Update tournament status to in_progress if not already
    if (tournament.status === 'upcoming') {
      await db.tournament.update({
        where: { id: tournamentId },
        data: { status: 'in_progress' },
      });
    }

    return NextResponse.json({
      scoringRound,
      round,
      tournament,
      participants,
      message: 'Live scoring started successfully',
    });
  } catch (error) {
    console.error('Error starting live scoring:', error);
    return NextResponse.json(
      { error: 'Failed to start live scoring' },
      { status: 500 }
    );
  }
}

// GET /api/tournaments/scoring - Get scoring rounds for a tournament
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');
    const scorerId = searchParams.get('scorerId');
    const groupLetter = searchParams.get('groupLetter');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { tournamentId };
    if (scorerId) where.scorerId = scorerId;
    if (groupLetter) where.groupLetter = groupLetter;

    const scoringRounds = await db.tournamentScoringRound.findMany({
      where,
      include: {
        scorer: { select: { id: true, name: true, avatar: true } },
        round: {
          include: {
            scores: true,
            course: { include: { holes: { orderBy: { holeNumber: 'asc' } } } },
          },
        },
      },
      orderBy: { groupLetter: 'asc' },
    });

    return NextResponse.json({ scoringRounds });
  } catch (error) {
    console.error('Error fetching scoring rounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scoring rounds' },
      { status: 500 }
    );
  }
}

// PUT /api/tournaments/scoring - Update scoring round (complete, abandon, update current hole)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { scoringRoundId, status, currentHole, roundId, scores, playerScores, playerNames, playerHandicap, completed } = body;

    if (!scoringRoundId) {
      return NextResponse.json(
        { error: 'scoringRoundId is required' },
        { status: 400 }
      );
    }

    const existingScoringRound = await db.tournamentScoringRound.findUnique({
      where: { id: scoringRoundId },
    });

    if (!existingScoringRound) {
      return NextResponse.json({ error: 'Scoring round not found' }, { status: 404 });
    }

    // Update scoring round metadata
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (currentHole !== undefined) updateData.currentHole = currentHole;

    const updatedScoringRound = await db.tournamentScoringRound.update({
      where: { id: scoringRoundId },
      data: updateData,
    });

    // If round scores are being updated, update the linked round
    if (roundId && scores) {
      // Calculate totals from main player only (playerIndex 0)
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
      });

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
            allScores.push({
              holeNumber: s.holeNumber,
              strokes: s.strokes,
              putts: s.putts || 0,
              fairwayHit: s.fairwayHit ?? null,
              greenInReg: s.greenInReg || false,
              penalties: s.penalties || 0,
              playerIndex: ps.playerIndex + 1,
            });
          });
        });
      }

      const mainPlayerScores = allScores.filter(s => s.playerIndex === 0);
      const totalStrokes = mainPlayerScores.reduce((sum: number, s) => sum + s.strokes, 0);
      const totalPutts = mainPlayerScores.reduce((sum: number, s) => sum + (s.putts || 0), 0);
      const fairwaysHit = mainPlayerScores.filter(s => s.fairwayHit === true).length;
      const fairwaysTotal = mainPlayerScores.filter(s => s.fairwayHit !== null).length;
      const greensInReg = mainPlayerScores.filter(s => s.greenInReg).length;
      const penalties = mainPlayerScores.reduce((sum: number, s) => sum + (s.penalties || 0), 0);

      // Delete existing scores and recreate
      await db.roundScore.deleteMany({ where: { roundId } });

      await db.round.update({
        where: { id: roundId },
        data: {
          totalStrokes,
          totalPutts,
          fairwaysHit,
          fairwaysTotal,
          greensInReg,
          penalties,
          playerNames: playerNames !== undefined ? playerNames : undefined,
          playerHandicap: playerHandicap !== undefined ? playerHandicap : undefined,
          completed: completed !== undefined ? completed : undefined,
          completedAt: completed ? new Date() : undefined,
          scores: { create: allScores },
        },
      });

      // Always update scoredAt for all group participants when scores are saved
      const scoringRoundInfo = await db.tournamentScoringRound.findUnique({
        where: { id: scoringRoundId },
        include: {
          round: true,
        },
      });

      if (scoringRoundInfo) {
        // Mark all participants in this group as having been scored
        await db.tournamentParticipant.updateMany({
          where: {
            tournamentId: scoringRoundInfo.tournamentId,
            groupLetter: scoringRoundInfo.groupLetter,
          },
          data: { scoredAt: new Date() },
        });

        // If completing, also calculate and update gross/net scores
        if (completed) {
          const tournament = await db.tournament.findUnique({
            where: { id: scoringRoundInfo.tournamentId },
            include: { course: { include: { holes: true } } },
          });

          if (tournament) {
            const coursePar = tournament.course.holes.reduce((sum: number, h) => sum + h.par, 0);
            const holes = tournament.course.holes.length;

            // Get all participants in this group
            const participants = await db.tournamentParticipant.findMany({
              where: { tournamentId: scoringRoundInfo.tournamentId, groupLetter: scoringRoundInfo.groupLetter },
            });

            // Update each player's gross score based on their playerIndex
            for (const participant of participants) {
              let playerIndex = 0;
              if (participant.userId !== scoringRoundInfo.scorerId) {
                // Find the player's position in additional players
                const playerNames = scoringRoundInfo.round.playerNames
                  ? JSON.parse(scoringRoundInfo.round.playerNames)
                  : [];
                const addIdx = playerNames.findIndex((p: { userId: string }) => p.userId === participant.userId);
                playerIndex = addIdx + 1; // 1-based for additional players
              }

              const playerTotalStrokes = allScores
                .filter(s => s.playerIndex === playerIndex)
                .reduce((sum: number, s) => sum + s.strokes, 0);

              const playerHcp = participant.userId === scoringRoundInfo.scorerId
                ? scoringRoundInfo.round.playerHandicap || 0
                : (() => {
                    const playerNames = scoringRoundInfo.round.playerNames
                      ? JSON.parse(scoringRoundInfo.round.playerNames)
                      : [];
                    const p = playerNames.find((pn: { userId: string }) => pn.userId === participant.userId);
                    return p?.handicap || 0;
                  })();

              // For Stroke play: net = gross - handicap * 0.85 (rough approximation)
              const netScore = Math.round(playerTotalStrokes - (playerHcp * 0.85));

              await db.tournamentParticipant.update({
                where: {
                  tournamentId_userId: {
                    tournamentId: scoringRoundInfo.tournamentId,
                    userId: participant.userId,
                  },
                },
                data: {
                  grossScore: playerTotalStrokes,
                  netScore: playerTotalStrokes > 0 ? netScore : null,
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ scoringRound: updatedScoringRound });
  } catch (error) {
    console.error('Error updating scoring round:', error);
    return NextResponse.json(
      { error: 'Failed to update scoring round' },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/scoring - Abandon a scoring round
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scoringRoundId = searchParams.get('scoringRoundId');

    if (!scoringRoundId) {
      return NextResponse.json(
        { error: 'scoringRoundId is required' },
        { status: 400 }
      );
    }

    const scoringRound = await db.tournamentScoringRound.findUnique({
      where: { id: scoringRoundId },
    });

    if (!scoringRound) {
      return NextResponse.json({ error: 'Scoring round not found' }, { status: 404 });
    }

    // Mark as abandoned (don't delete — round stays in history)
    await db.tournamentScoringRound.update({
      where: { id: scoringRoundId },
      data: { status: 'abandoned' },
    });

    return NextResponse.json({ message: 'Scoring round abandoned' });
  } catch (error) {
    console.error('Error abandoning scoring round:', error);
    return NextResponse.json(
      { error: 'Failed to abandon scoring round' },
      { status: 500 }
    );
  }
}
