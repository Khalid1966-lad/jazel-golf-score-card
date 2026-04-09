import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/tournaments/recalculate - Recalculate all tournament leaderboard scores from actual round data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
    }

    // Get tournament with course par info
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: { course: { include: { holes: { select: { par: true } } } } },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Get all scoring rounds for this tournament (including abandoned — round data still exists)
    const scoringRounds = await db.tournamentScoringRound.findMany({
      where: { tournamentId },
      include: {
        scorer: { select: { id: true, name: true, handicap: true } },
        round: {
          include: { scores: true },
        },
      },
    });

    // Get all participants
    const participants = await db.tournamentParticipant.findMany({
      where: { tournamentId },
    });

    // Build a map: userId -> { totalStrokes, handicap, found }
    const playerTotals = new Map<string, { totalStrokes: number; handicap: number; found: boolean }>();

    // Initialize all participants with 0
    participants.forEach(p => {
      playerTotals.set(p.userId, { totalStrokes: 0, handicap: 0, found: false });
    });

    // For each scoring round, sum up actual scores from the round
    for (const sr of scoringRounds) {
      if (!sr.round) continue;

      const roundScores = sr.round.scores || [];
      const playerNames = sr.round.playerNames ? JSON.parse(sr.round.playerNames) : [];

      // Map playerIndex -> userId
      // playerIndex 0 = scorer
      // playerIndex 1,2,3 = additional players from playerNames
      const indexToUser = new Map<number, string>();
      indexToUser.set(0, sr.scorerId);
      playerNames.forEach((p: { userId?: string }, idx: number) => {
        if (p.userId) indexToUser.set(idx + 1, p.userId);
      });

      // Map playerIndex -> handicap
      const indexToHcp = new Map<number, number>();
      indexToHcp.set(0, sr.scorer.handicap || 0);
      playerNames.forEach((p: { handicap?: number }, idx: number) => {
        indexToHcp.set(idx + 1, p.handicap || 0);
      });

      // Group scores by playerIndex and sum strokes
      const scoresByPlayer = new Map<number, number>();
      roundScores.forEach(s => {
        const current = scoresByPlayer.get(s.playerIndex) || 0;
        scoresByPlayer.set(s.playerIndex, current + s.strokes);
      });

      // Accumulate per user
      scoresByPlayer.forEach((strokes, playerIndex) => {
        const userId = indexToUser.get(playerIndex);
        if (!userId) return;

        const existing = playerTotals.get(userId);
        if (existing) {
          existing.totalStrokes += strokes;
          existing.found = true;
          existing.handicap = indexToHcp.get(playerIndex) || existing.handicap;
        }
      });
    }

    // Update each participant
    for (const participant of participants) {
      const totals = playerTotals.get(participant.userId);

      if (!totals || !totals.found || totals.totalStrokes === 0) {
        // No scores found — reset (scorecard deleted or never scored)
        await db.tournamentParticipant.update({
          where: {
            tournamentId_userId: { tournamentId, userId: participant.userId },
          },
          data: {
            grossScore: null,
            netScore: null,
            scoredAt: null,
          },
        });
      } else {
        // Store net as the vs-par-minus-handicap value directly
        const coursePar = (tournament.course?.holes || []).reduce((sum, h) => sum + h.par, 0);
        const brutDiff = totals.totalStrokes - coursePar;
        const netDiff = brutDiff - totals.handicap;

        await db.tournamentParticipant.update({
          where: {
            tournamentId_userId: { tournamentId, userId: participant.userId },
          },
          data: {
            grossScore: totals.totalStrokes,
            netScore: netDiff,
          },
        });
      }
    }

    return NextResponse.json({ success: true, recalculated: participants.length });
  } catch (error) {
    console.error('Error recalculating tournament scores:', error);
    return NextResponse.json({ error: 'Failed to recalculate scores' }, { status: 500 });
  }
}
