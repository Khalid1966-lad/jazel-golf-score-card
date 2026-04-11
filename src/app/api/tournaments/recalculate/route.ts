import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/tournaments/recalculate - Recalculate all tournament leaderboard scores from actual round data
// grossScore = brut vs par = sum of (strokes - par) for each scored hole
// netScore = brut vs par - handicap
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
    }

    // Get tournament with course hole par info
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: { course: { include: { holes: { select: { holeNumber: true, par: true } } } } },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Build hole par map for per-hole calculation
    const holeParMap = new Map<number, number>();
    (tournament.course?.holes || []).forEach(h => {
      holeParMap.set(h.holeNumber, h.par || 4);
    });

    // Get all scoring rounds (including abandoned — round data still exists)
    const scoringRounds = await db.tournamentScoringRound.findMany({
      where: { tournamentId },
      include: {
        scorer: { select: { id: true, name: true, handicap: true } },
        round: {
          include: { scores: true },
        },
      },
    });

    // Get all participants with current user handicap (always fresh)
    const participantsWithUser = await db.tournamentParticipant.findMany({
      where: { tournamentId },
      include: { user: { select: { id: true, handicap: true } } },
    });

    // Track per-user: brut vs par (sum of strokes - par per hole), handicap, found
    const playerTotals = new Map<string, { brutVsPar: number; handicap: number; found: boolean; scoredHoles: number }>();

    // Build userId -> current handicap map (always fresh from User table)
    const userIdToHcp = new Map<string, number>();
    participantsWithUser.forEach(p => {
      userIdToHcp.set(p.userId, p.user.handicap || 0);
    });

    participantsWithUser.forEach(p => {
      playerTotals.set(p.userId, { brutVsPar: 0, handicap: p.user.handicap || 0, found: false, scoredHoles: 0 });
    });

    // Process each scoring round
    for (const sr of scoringRounds) {
      if (!sr.round) continue;

      const roundScores = sr.round.scores || [];
      const playerNames = sr.round.playerNames ? JSON.parse(sr.round.playerNames) : [];

      // Map playerIndex -> userId
      const indexToUser = new Map<number, string>();
      indexToUser.set(0, sr.scorerId);
      playerNames.forEach((p: { userId?: string }, idx: number) => {
        if (p.userId) indexToUser.set(idx + 1, p.userId);
      });

      // Map playerIndex -> handicap — USE CURRENT USER HANDICAP (not frozen from playerNames)
      const indexToHcp = new Map<number, number>();
      indexToHcp.set(0, userIdToHcp.get(sr.scorerId) || 0);
      playerNames.forEach((p: { userId?: string }, idx: number) => {
        const uid = p.userId;
        if (uid) indexToHcp.set(idx + 1, userIdToHcp.get(uid) || 0);
      });

      // Per-player per-hole: sum (strokes - par) for scored holes only (strokes > 0)
      const playerBrut = new Map<number, { diff: number; holes: number }>();
      roundScores.forEach(s => {
        if (s.strokes <= 0) return; // Only count scored holes
        const par = holeParMap.get(s.holeNumber) || 4;
        const current = playerBrut.get(s.playerIndex) || { diff: 0, holes: 0 };
        playerBrut.set(s.playerIndex, {
          diff: current.diff + (s.strokes - par),
          holes: current.holes + 1,
        });
      });

      // Accumulate per user
      playerBrut.forEach(({ diff, holes }, playerIndex) => {
        const userId = indexToUser.get(playerIndex);
        if (!userId) return;

        const existing = playerTotals.get(userId);
        if (existing) {
          existing.brutVsPar += diff;
          existing.scoredHoles += holes;
          existing.found = true;
          existing.handicap = indexToHcp.get(playerIndex) || existing.handicap;
        }
      });
    }

    // Update each participant
    for (const participant of participantsWithUser) {
      const totals = playerTotals.get(participant.userId);

      // Skip locked participants — their scores are preserved from admin validation
      if (participant.lockedAt) continue;

      if (!totals || !totals.found || totals.scoredHoles === 0) {
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
        const netVsPar = Math.round((totals.brutVsPar - totals.handicap) * 10) / 10;

        await db.tournamentParticipant.update({
          where: {
            tournamentId_userId: { tournamentId, userId: participant.userId },
          },
          data: {
            grossScore: totals.brutVsPar,
            netScore: netVsPar,
          },
        });
      }
    }

    return NextResponse.json({ success: true, recalculated: participantsWithUser.length });
  } catch (error) {
    console.error('Error recalculating tournament scores:', error);
    return NextResponse.json({ error: 'Failed to recalculate scores' }, { status: 500 });
  }
}
