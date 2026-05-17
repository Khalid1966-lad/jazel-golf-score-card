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

    // Verify the tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        course: {
          include: {
            holes: { orderBy: { holeNumber: 'asc' } },
            tees: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (!tournament.course.holes || tournament.course.holes.length === 0) {
      return NextResponse.json(
        { error: 'Tournament course has no holes defined. Please add holes to the course first.' },
        { status: 400 }
      );
    }

    // Auto-set tournament status to in_progress if it's upcoming
    if (tournament.status === 'upcoming') {
      await db.tournament.update({
        where: { id: tournamentId },
        data: { status: 'in_progress' },
      });
    }

    if (tournament.status === 'cancelled' || tournament.status === 'completed') {
      return NextResponse.json(
        { error: `Tournament is ${tournament.status}. Cannot start scoring.` },
        { status: 400 }
      );
    }

    // Check if there's already an active scoring round for this group
    let existingScoresByUser = new Map<string, Map<number, any>>(); // userId -> holeNumber -> score
    let existingCurrentHole = 1;

    try {
      const existingScoring = await db.tournamentScoringRound.findUnique({
        where: { tournamentId_groupLetter: { tournamentId, groupLetter } },
      });

      if (existingScoring && existingScoring.status === 'active') {
        // If the active round belongs to a different scorer, abandon it and preserve its scores
        if (existingScoring.scorerId !== scorerId) {
          console.log(`[Scoring] Scorer changed from ${existingScoring.scorerId} to ${scorerId} in group ${groupLetter}, abandoning old round`);

          // Fetch old round's scores to carry over to new round
          const oldRound = await db.round.findUnique({
            where: { id: existingScoring.roundId },
            include: { scores: true },
          });

          if (oldRound) {
            existingCurrentHole = existingScoring.currentHole || 1;

            // Build map: old playerIndex -> userId
            const oldPlayerNames = oldRound.playerNames ? JSON.parse(oldRound.playerNames) : [];
            const indexToUserId = new Map<number, string>();
            indexToUserId.set(0, existingScoring.scorerId); // old scorer = playerIndex 0
            oldPlayerNames.forEach((p: { userId?: string }, idx: number) => {
              if (p.userId) indexToUserId.set(idx + 1, p.userId);
            });

            // Build map: userId -> (holeNumber -> scoreRecord)
            (oldRound.scores || []).forEach((s: any) => {
              if (s.strokes <= 0) return; // Skip unscored holes
              const userId = indexToUserId.get(s.playerIndex);
              if (!userId) return;
              const userScores = existingScoresByUser.get(userId) || new Map<number, any>();
              userScores.set(s.holeNumber, s);
              existingScoresByUser.set(userId, userScores);
            });

            console.log(`[Scoring] Preserving scores for ${existingScoresByUser.size} players, currentHole: ${existingCurrentHole}`);
          }

          await db.tournamentScoringRound.update({
            where: { id: existingScoring.id },
            data: { status: 'abandoned' },
          });
          // Don't return — fall through to create a new scoring round with preserved scores below
        } else {
          // Same scorer — return the existing scoring round
          const existingRound = await db.round.findUnique({
            where: { id: existingScoring.roundId },
            include: { scores: { orderBy: { holeNumber: 'asc' } } },
          });
          return NextResponse.json({
            scoringRound: existingScoring,
            round: existingRound,
            tournament,
            message: 'Active scoring round already exists for this group',
          });
        }
      }
    } catch {
      // TournamentScoringRound table might not exist yet - continue to create it
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

    // Verify scorer is in this group
    const scorerParticipant = participants.find(p => p.userId === scorerId);
    if (!scorerParticipant) {
      return NextResponse.json(
        { error: 'Scorer must be a participant in this group' },
        { status: 400 }
      );
    }

    // Check if scorer is designated (graceful - isScorer column might not exist yet)
    const isScorer = (scorerParticipant as any).isScorer;
    if (isScorer === false) {
      return NextResponse.json(
        { error: 'Only designated scorers can start scoring. Contact the tournament admin.' },
        { status: 403 }
      );
    }
    // If isScorer is undefined (column doesn't exist), allow it (backward compat)

    // Build additional players list (all group members except scorer)
    const scorer = participants.find(p => p.userId === scorerId)!;
    const otherPlayers = participants.filter(p => p.userId !== scorerId);

    // Build new playerIndex mapping: userId -> new playerIndex
    // playerIndex 0 = new scorer, 1+ = otherPlayers in order
    const newUserIdToIndex = new Map<string, number>();
    newUserIdToIndex.set(scorerId, 0);
    otherPlayers.forEach((p, idx) => newUserIdToIndex.set(p.userId, idx + 1));

    // Helper: get preserved score for a user on a hole, remapped to new playerIndex
    const getPreservedScore = (userId: string, holeNumber: number, playerIndex: number) => {
      const userScores = existingScoresByUser.get(userId);
      if (!userScores) return null;
      const oldScore = userScores.get(holeNumber);
      if (!oldScore) return null;
      return {
        holeNumber,
        strokes: oldScore.strokes,
        putts: oldScore.putts || 0,
        playerIndex,
        penalties: oldScore.penalties || 0,
        sandShots: oldScore.sandShots || 0,
        chipShots: oldScore.chipShots || 0,
        fairwayHit: oldScore.fairwayHit ?? null,
        greenInReg: oldScore.greenInReg ?? null,
        driveDistance: oldScore.driveDistance ?? null,
      };
    };

    // Create the Round record (scorer is the main player) with preserved scores
    const hasPreservedScores = existingScoresByUser.size > 0;

    const round = await db.round.create({
      data: {
        userId: scorerId,
        courseId: tournament.courseId,
        holesPlayed: tournament.course.holes.length >= 9 ? 18 : tournament.course.holes.length,
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
          create: tournament.course.holes.flatMap(hole => {
            const allPlayersWithIndices = [
              { userId: scorerId, playerIndex: 0 },
              ...otherPlayers.map((p, idx) => ({ userId: p.userId, playerIndex: idx + 1 })),
            ];

            return allPlayersWithIndices.map(({ userId, playerIndex }) => {
              // Try to get preserved score
              const preserved = hasPreservedScores ? getPreservedScore(userId, hole.holeNumber, playerIndex) : null;
              if (preserved) return preserved;

              // No preserved score — default zero
              return {
                holeNumber: hole.holeNumber,
                strokes: 0,
                putts: 0,
                playerIndex,
              };
            });
          }),
        },
      },
      include: { scores: { orderBy: { holeNumber: 'asc' } } },
    });

    // Create the TournamentScoringRound link — use preserved currentHole if scorer changed
    let scoringRound;
    try {
      scoringRound = await db.tournamentScoringRound.create({
        data: {
          tournamentId,
          groupLetter,
          scorerId,
          roundId: round.id,
          status: 'active',
          currentHole: hasPreservedScores ? existingCurrentHole : 1,
        },
      });
    } catch {
      // If TournamentScoringRound table doesn't exist, continue without it
      scoringRound = {
        id: 'direct',
        tournamentId,
        groupLetter,
        scorerId,
        roundId: round.id,
        status: 'active',
        currentHole: hasPreservedScores ? existingCurrentHole : 1,
      };
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
    const message = error instanceof Error ? error.message : 'Failed to start live scoring';
    return NextResponse.json(
      { error: message },
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

    let scoringRounds: any[] = [];
    try {
      scoringRounds = await db.tournamentScoringRound.findMany({
        where,
        include: {
          scorer: { select: { id: true, name: true, avatar: true } },
          round: {
            include: {
              scores: { orderBy: { holeNumber: 'asc' } },
              course: {
                include: {
                  holes: { orderBy: { holeNumber: 'asc' } },
                  tees: { select: { id: true, name: true, color: true } },
                },
              },
            },
          },
        },
        orderBy: { groupLetter: 'asc' },
      });
    } catch {
      // TournamentScoringRound table might not exist
      scoringRounds = [];
    }

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

    let existingScoringRound;
    try {
      existingScoringRound = await db.tournamentScoringRound.findUnique({
        where: { id: scoringRoundId },
      });
    } catch {
      existingScoringRound = null;
    }

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

      // Upsert scores (update existing, create new) instead of delete+recreate
      await Promise.all(allScores.map(s =>
        db.roundScore.upsert({
          where: {
            roundId_holeNumber_playerIndex: {
              roundId,
              holeNumber: s.holeNumber,
              playerIndex: s.playerIndex,
            },
          },
          update: {
            strokes: s.strokes,
            putts: s.putts || 0,
            fairwayHit: s.fairwayHit ?? null,
            greenInReg: s.greenInReg || false,
            penalties: s.penalties || 0,
            sandShots: s.sandShots || 0,
            chipShots: s.chipShots || 0,
            driveDistance: s.driveDistance || null,
          },
          create: {
            roundId,
            holeNumber: s.holeNumber,
            strokes: s.strokes,
            putts: s.putts || 0,
            fairwayHit: s.fairwayHit ?? null,
            greenInReg: s.greenInReg || false,
            penalties: s.penalties || 0,
            sandShots: s.sandShots || 0,
            chipShots: s.chipShots || 0,
            driveDistance: s.driveDistance || null,
            playerIndex: s.playerIndex,
          },
        })
      ));

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
        },
      });

      // Update scoredAt for group participants
      try {
        const scoringRoundInfo = await db.tournamentScoringRound.findUnique({
          where: { id: scoringRoundId },
          include: { round: true },
        });

        if (scoringRoundInfo) {
          // Mark all participants in this group as having been scored
          await db.tournamentParticipant.updateMany({
            where: {
              tournamentId: scoringRoundInfo.tournamentId,
              groupLetter: scoringRoundInfo.groupLetter,
            },
            data: { scoredAt: new Date() },
          }).catch(() => {});

          // Calculate and update gross/net scores for ALL saves (draft + completed)
          // grossScore = brut vs par = sum of (strokes - par) for each hole with strokes > 0
          // netScore = brut vs par - handicap
          const tournament = await db.tournament.findUnique({
            where: { id: scoringRoundInfo.tournamentId },
            include: { course: { include: { holes: true } } },
          });

          if (tournament) {
            // Build hole par map
            const holeParMap = new Map<number, number>();
            (tournament.course?.holes || []).forEach((h: any) => {
              holeParMap.set(h.holeNumber, h.par || 4);
            });

            // Get all participants in this group
            const participants = await db.tournamentParticipant.findMany({
              where: { tournamentId: scoringRoundInfo.tournamentId, groupLetter: scoringRoundInfo.groupLetter },
            });

            // Update each player's gross score based on their playerIndex
            for (const participant of participants) {
              // Skip if this participant's scores are locked by admin
              console.log('[PUT SCORING] participant:', participant.userId, 'lockedAt:', participant.lockedAt, 'group:', scoringRoundInfo.groupLetter);
              if (participant.lockedAt) {
                console.log('[PUT SCORING] SKIP locked participant:', participant.userId);
                continue;
              }

              let playerIndex = 0;
              if (participant.userId !== scoringRoundInfo.scorerId) {
                const playerNames = scoringRoundInfo.round.playerNames
                  ? JSON.parse(scoringRoundInfo.round.playerNames)
                  : [];
                const addIdx = playerNames.findIndex((p: { userId: string }) => p.userId === participant.userId);
                playerIndex = addIdx + 1;
              }

              // Calculate brut vs par: sum of (strokes - par) for scored holes only
              const playerScores = allScores.filter(s => s.playerIndex === playerIndex && s.strokes > 0);
              const brutVsPar = playerScores.reduce((sum: number, s) => sum + (s.strokes - (holeParMap.get(s.holeNumber) || 4)), 0);

              const playerHcp = participant.userId === scoringRoundInfo.scorerId
                ? scoringRoundInfo.round.playerHandicap || 0
                : (() => {
                    const playerNames = scoringRoundInfo.round.playerNames
                      ? JSON.parse(scoringRoundInfo.round.playerNames)
                      : [];
                    const p = playerNames.find((pn: { userId: string }) => pn.userId === participant.userId);
                    return p?.handicap || 0;
                  })();

              const netVsPar = brutVsPar - playerHcp;

              await db.tournamentParticipant.update({
                where: {
                  tournamentId_userId: {
                    tournamentId: scoringRoundInfo.tournamentId,
                    userId: participant.userId,
                  },
                },
                data: {
                  grossScore: playerScores.length > 0 ? brutVsPar : null,
                  netScore: playerScores.length > 0 ? netVsPar : null,
                },
              });
            }
          }
        }
      } catch {
        // scoredAt or gross/net update failed - not critical, scores still saved
      }
    }

    return NextResponse.json({ scoringRound: updatedScoringRound });
  } catch (error) {
    console.error('Error updating scoring round:', error);
    const message = error instanceof Error ? error.message : 'Failed to update scoring round';
    return NextResponse.json(
      { error: message },
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

    let scoringRound;
    try {
      scoringRound = await db.tournamentScoringRound.findUnique({
        where: { id: scoringRoundId },
      });
    } catch {
      return NextResponse.json({ error: 'Scoring round not found' }, { status: 404 });
    }

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
