import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/tournaments/snapshot - Create a frozen scorecard snapshot for a tournament
// This makes the scorecard data immutable — it survives even if scorers delete their rounds
// Only admin can create a snapshot. Only way to remove it is deleting the tournament.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, adminId } = body;

    if (!tournamentId || !adminId) {
      return NextResponse.json({ error: 'tournamentId and adminId are required' }, { status: 400 });
    }

    // Verify admin
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { adminId: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.adminId !== adminId) {
      return NextResponse.json({ error: 'Only the tournament admin can create a snapshot' }, { status: 403 });
    }

    // Check if snapshot already exists
    const existing = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { scorecardSnapshot: true },
    });

    if (existing.scorecardSnapshot) {
      return NextResponse.json({ error: 'Scorecard snapshot already exists. Delete the tournament to remove it.' }, { status: 400 });
    }

    // Fetch course holes
    const tournamentFull = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { courseId: true },
    });

    if (!tournamentFull) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const holes = await db.courseHole.findMany({
      where: { courseId: tournamentFull.courseId },
      orderBy: { holeNumber: 'asc' },
      select: { holeNumber: true, par: true, handicap: true },
    });

    const totalHoles = holes.length || 18;

    // Fetch all participants
    const participants = await db.tournamentParticipant.findMany({
      where: { tournamentId },
      include: {
        user: { select: { id: true, name: true, handicap: true } },
      },
      orderBy: { groupLetter: 'asc' },
    });

    // Fetch all scoring rounds with detailed scores
    const scoringRounds = await db.tournamentScoringRound.findMany({
      where: { tournamentId },
      include: {
        scorer: { select: { id: true, name: true, handicap: true } },
        round: {
          include: {
            scores: { orderBy: [{ holeNumber: 'asc' }, { playerIndex: 'asc' }] },
          },
        },
      },
    });

    // Build hole par map
    const holeParMap = new Map<number, number>();
    holes.forEach(h => holeParMap.set(h.holeNumber, h.par));

    // Build participant map
    const participantMap = new Map<string, typeof participants[0]>();
    participants.forEach(p => participantMap.set(p.userId, p));

    // Build player data (same logic as scorecard API)
    const playerMap = new Map<string, {
      name: string;
      handicap: number;
      groupLetter: string;
      scores: (number | null)[];
      gross: number;
      net: number;
    }>();

    for (const sr of scoringRounds) {
      if (!sr.round) continue;

      const roundScores = sr.round.scores || [];
      const playerNamesRaw = sr.round.playerNames ? JSON.parse(sr.round.playerNames) : [];

      const allPlayers: Array<{ userId: string; name: string; handicap: number; groupLetter: string }> = [];

      const scorerParticipant = participantMap.get(sr.scorerId);
      allPlayers.push({
        userId: sr.scorerId,
        name: sr.scorer.name || 'Unknown',
        handicap: sr.scorer.handicap || 0,
        groupLetter: scorerParticipant?.groupLetter || sr.groupLetter || '',
      });

      for (let idx = 0; idx < playerNamesRaw.length; idx++) {
        const pn = playerNamesRaw[idx];
        const userId = pn.userId || pn.id || `unknown_${idx}`;
        const participant = participantMap.get(userId);
        allPlayers.push({
          userId,
          name: pn.name || 'Unknown',
          handicap: pn.handicap || 0,
          groupLetter: participant?.groupLetter || sr.groupLetter || '',
        });
      }

      const scoresByPlayer = new Map<number, Map<number, number>>();
      roundScores.forEach(s => {
        if (s.strokes <= 0) return;
        const playerScores = scoresByPlayer.get(s.playerIndex) || new Map<number, number>();
        playerScores.set(s.holeNumber, s.strokes);
        scoresByPlayer.set(s.playerIndex, playerScores);
      });

      for (let playerIdx = 0; playerIdx < allPlayers.length; playerIdx++) {
        const pInfo = allPlayers[playerIdx];
        const existing = playerMap.get(pInfo.userId);
        const scores = existing?.scores ? [...existing.scores] : new Array(totalHoles).fill(null) as (number | null)[];
        const playerScores = scoresByPlayer.get(playerIdx) || new Map<number, number>();

        holes.forEach((hole, idx) => {
          if (playerScores.has(hole.holeNumber)) {
            scores[idx] = playerScores.get(hole.holeNumber)!;
          }
        });

        let brutVsPar = 0;
        let hasAnyScore = false;
        holes.forEach((hole, idx) => {
          if (scores[idx] !== null) {
            hasAnyScore = true;
            const par = hole.par || 4;
            brutVsPar += (scores[idx]! - par);
          }
        });

        if (!hasAnyScore) continue;

        const netScore = Math.round((brutVsPar - pInfo.handicap) * 10) / 10;

        playerMap.set(pInfo.userId, {
          name: pInfo.name,
          handicap: pInfo.handicap,
          groupLetter: pInfo.groupLetter,
          scores,
          gross: brutVsPar,
          net: netScore,
        });
      }
    }

    // Also include participants with stored scores but no detailed holes
    for (const p of participants) {
      if (playerMap.has(p.userId)) continue;
      if (p.grossScore === null && p.netScore === null) continue;

      playerMap.set(p.userId, {
        name: p.user.name || 'Unknown',
        handicap: p.user.handicap || 0,
        groupLetter: p.groupLetter || '',
        scores: new Array(totalHoles).fill(null) as (number | null)[],
        gross: p.grossScore || 0,
        net: p.netScore || 0,
      });
    }

    // Sort by net score
    const players = Array.from(playerMap.values()).sort((a, b) => {
      const aNet = a.scores.some(s => s !== null) ? a.net : Infinity;
      const bNet = b.scores.some(s => s !== null) ? b.net : Infinity;
      return aNet - bNet;
    });

    // Build snapshot data
    const tournamentInfo = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: { course: { select: { name: true, city: true } } },
    });

    const snapshot = {
      tournament: {
        name: tournamentInfo!.name,
        date: tournamentInfo!.date.toISOString(),
        format: tournamentInfo!.format,
        course: {
          name: tournamentInfo!.course.name,
          city: tournamentInfo!.course.city,
        },
      },
      holes: holes.map(h => ({
        number: h.holeNumber,
        par: h.par,
        hcpIndex: h.handicap,
      })),
      players,
      frozenAt: new Date().toISOString(),
      frozenBy: adminId,
    };

    // Store snapshot
    await db.tournament.update({
      where: { id: tournamentId },
      data: {
        scorecardSnapshot: JSON.stringify(snapshot),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Scorecard snapshot created — scores are now frozen and immutable',
      playerCount: players.length,
    });
  } catch (error) {
    console.error('Error creating tournament snapshot:', error);
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
  }
}

// DELETE /api/tournaments/snapshot - Admin can unfreeze (only if no rounds deleted)
// Use with caution — allows re-scoring
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, adminId } = body;

    if (!tournamentId || !adminId) {
      return NextResponse.json({ error: 'tournamentId and adminId are required' }, { status: 400 });
    }

    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { adminId: true, scorecardSnapshot: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.adminId !== adminId) {
      return NextResponse.json({ error: 'Only the tournament admin can remove a snapshot' }, { status: 403 });
    }

    if (!tournament.scorecardSnapshot) {
      return NextResponse.json({ error: 'No snapshot exists' }, { status: 400 });
    }

    await db.tournament.update({
      where: { id: tournamentId },
      data: { scorecardSnapshot: null },
    });

    return NextResponse.json({ success: true, message: 'Scorecard snapshot removed — scores can be modified again' });
  } catch (error) {
    console.error('Error removing tournament snapshot:', error);
    return NextResponse.json({ error: 'Failed to remove snapshot' }, { status: 500 });
  }
}
