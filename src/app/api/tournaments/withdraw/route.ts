import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/tournaments/withdraw - Mark a player as withdrawn (WD)
// Admin action: clears scores for holes after wdHole, marks player as WD
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, userId, wdHole } = body;

    if (!tournamentId || !userId) {
      return NextResponse.json(
        { error: 'tournamentId and userId are required' },
        { status: 400 }
      );
    }

    // Verify participant exists and get their group
    const participant = await db.tournamentParticipant.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // If already withdrawn, return current state
    if (participant.withdrawn) {
      return NextResponse.json({
        participant,
        message: 'Player is already withdrawn',
      });
    }

    // If wdHole is specified, clear scores for holes AFTER wdHole in the scorer's round
    if (wdHole && participant.groupLetter) {
      try {
        const scoringRound = await db.tournamentScoringRound.findUnique({
          where: { tournamentId_groupLetter: { tournamentId, groupLetter: participant.groupLetter } },
          include: {
            round: { include: { scores: true } },
          },
        });

        if (scoringRound && scoringRound.round) {
          // Determine playerIndex for this userId
          let playerIndex = 0;
          if (userId !== scoringRound.scorerId) {
            const playerNamesRaw = scoringRound.round.playerNames
              ? JSON.parse(scoringRound.round.playerNames)
              : [];
            const foundIdx = playerNamesRaw.findIndex((p: { userId: string }) => p.userId === userId);
            if (foundIdx >= 0) playerIndex = foundIdx + 1;
          }

          // Clear strokes for all holes > wdHole for this player
          const scoresToClear = scoringRound.round.scores.filter(
            (s) => s.playerIndex === playerIndex && s.holeNumber > wdHole && s.strokes > 0
          );

          if (scoresToClear.length > 0) {
            await Promise.all(
              scoresToClear.map((s) =>
                db.roundScore.update({
                  where: { id: s.id },
                  data: { strokes: 0 },
                })
              )
            );
            console.log(`[WD] Cleared ${scoresToClear.length} scores for player ${userId} after hole ${wdHole}`);
          }

          // Recalculate gross/net for this player after clearing
          const tournament = await db.tournament.findUnique({
            where: { id: tournamentId },
            select: { courseId: true },
          });

          const courseHoles = tournament?.courseId
            ? await db.courseHole.findMany({
                where: { courseId: tournament.courseId },
                select: { holeNumber: true, par: true },
              })
            : [];

          const holeParMap = new Map<number, number>();
          courseHoles.forEach((h) => holeParMap.set(h.holeNumber, h.par || 4));

          // Get remaining scores (strokes > 0, holes <= wdHole)
          const remainingScores = scoringRound.round.scores.filter(
            (s) => s.playerIndex === playerIndex && s.strokes > 0 && s.holeNumber <= wdHole
          );

          if (remainingScores.length > 0) {
            const brutVsPar = remainingScores.reduce(
              (sum, s) => sum + (s.strokes - (holeParMap.get(s.holeNumber) || 4)),
              0
            );
            const playerHcp =
              playerIndex === 0
                ? scoringRound.round.playerHandicap || 0
                : (() => {
                    const pNames = scoringRound.round.playerNames
                      ? JSON.parse(scoringRound.round.playerNames)
                      : [];
                    const p = pNames.find((pn: { userId: string }) => pn.userId === userId);
                    return p?.handicap || 0;
                  })();
            const netVsPar = Math.round((brutVsPar - playerHcp) * 10) / 10;

            await db.tournamentParticipant.update({
              where: { tournamentId_userId: { tournamentId, userId } },
              data: { grossScore: brutVsPar, netScore: netVsPar },
            });
          }
        }
      } catch (err) {
        console.error('[WD] Error clearing scores after wdHole:', err);
        // Non-critical: still mark as withdrawn even if score clearing fails
      }
    }

    // Mark as withdrawn
    const updated = await db.tournamentParticipant.update({
      where: { tournamentId_userId: { tournamentId, userId } },
      data: {
        withdrawn: true,
        wdHole: wdHole || null,
      },
      include: {
        user: {
          select: { id: true, name: true, handicap: true },
        },
      },
    });

    console.log(`[WD] Player ${userId} withdrawn from tournament ${tournamentId} at hole ${wdHole || 'N/A'}`);

    return NextResponse.json({
      participant: updated,
      message: `Player marked as withdrawn${wdHole ? ` after hole ${wdHole}` : ''}`,
    });
  } catch (error) {
    console.error('Error marking player as withdrawn:', error);
    return NextResponse.json(
      { error: 'Failed to mark player as withdrawn: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/withdraw - Revoke a withdrawal (admin correction)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, userId } = body;

    if (!tournamentId || !userId) {
      return NextResponse.json(
        { error: 'tournamentId and userId are required' },
        { status: 400 }
      );
    }

    const participant = await db.tournamentParticipant.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    if (!participant.withdrawn) {
      return NextResponse.json({ error: 'Player is not withdrawn' }, { status: 400 });
    }

    // Revoke WD
    const updated = await db.tournamentParticipant.update({
      where: { tournamentId_userId: { tournamentId, userId } },
      data: {
        withdrawn: false,
        wdHole: null,
      },
      include: {
        user: {
          select: { id: true, name: true, handicap: true },
        },
      },
    });

    console.log(`[WD] Withdrawal revoked for player ${userId} in tournament ${tournamentId}`);

    return NextResponse.json({
      participant: updated,
      message: 'Withdrawal revoked',
    });
  } catch (error) {
    console.error('Error revoking withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to revoke withdrawal: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
