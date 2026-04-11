import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/tournaments/validate - Lock (validate) a group's scores
// Admin confirms scores are correct -> saves snapshot + sets lockedAt on all group participants
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, groupLetter, adminId } = body;

    if (!tournamentId || !groupLetter || !adminId) {
      return NextResponse.json(
        { error: 'tournamentId, groupLetter, and adminId are required' },
        { status: 400 }
      );
    }

    // Verify tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { adminId: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Get all participants in this group
    const participants = await db.tournamentParticipant.findMany({
      where: { tournamentId, groupLetter },
    });

    if (participants.length === 0) {
      return NextResponse.json({ error: 'No participants in this group' }, { status: 404 });
    }

    // Lock all participants: save current grossScore/netScore as snapshot, set lockedAt
    const now = new Date();
    let lockedCount = 0;

    for (const participant of participants) {
      // Save snapshot of current scores (even if null)
      const snapshot = JSON.stringify({
        grossScore: participant.grossScore,
        netScore: participant.netScore,
      });

      console.log('[LOCK] Locking participant:', participant.userId, 'lockedAt before:', participant.lockedAt, 'setting to:', now.toISOString());

      const result = await db.tournamentParticipant.update({
        where: {
          tournamentId_userId: {
            tournamentId,
            userId: participant.userId,
          },
        },
        data: {
          lockedAt: now,
          scoreSnapshot: snapshot,
          // Also ensure grossScore/netScore are preserved at lock time
          grossScore: participant.grossScore,
          netScore: participant.netScore,
        },
      });
      console.log('[LOCK] Result lockedAt:', result.lockedAt);
      lockedCount++;
    }

    console.log('[LOCK] Total locked:', lockedCount, 'for group:', groupLetter);

    // Check if ALL groups are now locked — if so, auto-create scorecard snapshot
    if (lockedCount > 0) {
      const allParticipants = await db.tournamentParticipant.findMany({
        where: { tournamentId },
        select: { lockedAt: true },
      });

      const totalParticipants = allParticipants.length;
      const lockedParticipants = allParticipants.filter(p => p.lockedAt !== null).length;

      if (totalParticipants > 0 && lockedParticipants === totalParticipants) {
        // All participants locked — check if snapshot already exists
        const tournamentWithSnapshot = await db.tournament.findUnique({
          where: { id: tournamentId },
          select: { scorecardSnapshot: true, courseId: true },
        });

        if (!tournamentWithSnapshot.scorecardSnapshot) {
          // Auto-create snapshot using same logic as /api/tournaments/snapshot
          try {
            const holes = await db.courseHole.findMany({
              where: { courseId: tournamentWithSnapshot.courseId },
              orderBy: { holeNumber: 'asc' },
              select: { holeNumber: true, par: true, handicap: true },
            });

            const totalHoles = holes.length || 18;

            const participantsWithUsers = await db.tournamentParticipant.findMany({
              where: { tournamentId },
              include: { user: { select: { id: true, name: true, handicap: true } } },
              orderBy: { groupLetter: 'asc' },
            });

            const scoringRounds = await db.tournamentScoringRound.findMany({
              where: { tournamentId },
              include: {
                scorer: { select: { id: true, name: true, handicap: true } },
                round: { include: { scores: { orderBy: [{ holeNumber: 'asc' }, { playerIndex: 'asc' }] } } },
              },
            });

            const holeParMap = new Map<number, number>();
            holes.forEach(h => holeParMap.set(h.holeNumber, h.par));

            const participantMap = new Map<string, typeof participantsWithUsers[0]>();
            participantsWithUsers.forEach(p => participantMap.set(p.userId, p));

            const playerMap = new Map<string, { name: string; handicap: number; groupLetter: string; scores: (number | null)[]; gross: number; net: number }>();

            for (const sr of scoringRounds) {
              if (!sr.round) continue;
              const roundScores = sr.round.scores || [];
              const playerNamesRaw = sr.round.playerNames ? JSON.parse(sr.round.playerNames) : [];

              const allPlayers: Array<{ userId: string; name: string; handicap: number; groupLetter: string }> = [];
              const scorerParticipant = participantMap.get(sr.scorerId);
              allPlayers.push({ userId: sr.scorerId, name: sr.scorer.name || 'Unknown', handicap: sr.scorer.handicap || 0, groupLetter: scorerParticipant?.groupLetter || sr.groupLetter || '' });

              for (let idx = 0; idx < playerNamesRaw.length; idx++) {
                const pn = playerNamesRaw[idx];
                const userId = pn.userId || pn.id || `unknown_${idx}`;
                const participant = participantMap.get(userId);
                allPlayers.push({ userId, name: pn.name || 'Unknown', handicap: pn.handicap || 0, groupLetter: participant?.groupLetter || sr.groupLetter || '' });
              }

              const scoresByPlayer = new Map<number, Map<number, number>>();
              roundScores.forEach(s => { if (s.strokes <= 0) return; const ps = scoresByPlayer.get(s.playerIndex) || new Map(); ps.set(s.holeNumber, s.strokes); scoresByPlayer.set(s.playerIndex, ps); });

              for (let playerIdx = 0; playerIdx < allPlayers.length; playerIdx++) {
                const pInfo = allPlayers[playerIdx];
                const existing = playerMap.get(pInfo.userId);
                const scores = existing?.scores ? [...existing.scores] : new Array(totalHoles).fill(null) as (number | null)[];
                const playerScores = scoresByPlayer.get(playerIdx) || new Map<number, number>();

                holes.forEach((hole, idx) => { if (playerScores.has(hole.holeNumber)) scores[idx] = playerScores.get(hole.holeNumber)!; });

                let brutVsPar = 0; let hasAnyScore = false;
                holes.forEach((hole, idx) => { if (scores[idx] !== null) { hasAnyScore = true; brutVsPar += (scores[idx]! - (hole.par || 4)); } });
                if (!hasAnyScore) continue;

                const netScore = Math.round((brutVsPar - pInfo.handicap) * 10) / 10;
                playerMap.set(pInfo.userId, { name: pInfo.name, handicap: pInfo.handicap, groupLetter: pInfo.groupLetter, scores, gross: brutVsPar, net: netScore });
              }
            }

            // Include participants with stored scores but no detailed holes
            for (const p of participantsWithUsers) {
              if (playerMap.has(p.userId)) continue;
              if (p.grossScore === null && p.netScore === null) continue;
              playerMap.set(p.userId, { name: p.user.name || 'Unknown', handicap: p.user.handicap || 0, groupLetter: p.groupLetter || '', scores: new Array(totalHoles).fill(null) as (number | null)[], gross: p.grossScore || 0, net: p.netScore || 0 });
            }

            const players = Array.from(playerMap.values()).sort((a, b) => { const aN = a.scores.some(s => s !== null) ? a.net : Infinity; const bN = b.scores.some(s => s !== null) ? b.net : Infinity; return aN - bN; });

            const tournamentInfo = await db.tournament.findUnique({
              where: { id: tournamentId },
              include: { course: { select: { name: true, city: true } } },
            });

            const snapshot = {
              tournament: { name: tournamentInfo!.name, date: tournamentInfo!.date.toISOString(), format: tournamentInfo!.format, course: { name: tournamentInfo!.course.name, city: tournamentInfo!.course.city } },
              holes: holes.map(h => ({ number: h.holeNumber, par: h.par, hcpIndex: h.handicap })),
              players,
              frozenAt: new Date().toISOString(),
              frozenBy: adminId,
              autoFrozen: true,
            };

            await db.tournament.update({
              where: { id: tournamentId },
              data: { scorecardSnapshot: JSON.stringify(snapshot) },
            });

            console.log('[SNAPSHOT] Auto-created scorecard snapshot — all groups locked');
          } catch (snapshotError) {
            console.error('[SNAPSHOT] Failed to auto-create snapshot:', snapshotError);
            // Don't fail the lock operation — snapshot is best-effort
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Group ${groupLetter} scores locked (${lockedCount} players)`,
      lockedCount,
    });
  } catch (error) {
    console.error('Error locking group scores:', error);
    const message = error instanceof Error ? error.message : 'Failed to lock scores';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/tournaments/validate - Unlock a group's scores
// Admin re-enables editing for a group
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, groupLetter } = body;

    if (!tournamentId || !groupLetter) {
      return NextResponse.json(
        { error: 'tournamentId and groupLetter are required' },
        { status: 400 }
      );
    }

    // Get all participants in this group that are locked
    const participants = await db.tournamentParticipant.findMany({
      where: { tournamentId, groupLetter, lockedAt: { not: null } },
    });

    if (participants.length === 0) {
      return NextResponse.json({ error: 'Group is not locked' }, { status: 400 });
    }

    let unlockedCount = 0;
    for (const participant of participants) {
      await db.tournamentParticipant.update({
        where: {
          tournamentId_userId: {
            tournamentId,
            userId: participant.userId,
          },
        },
        data: {
          lockedAt: null,
          scoreSnapshot: null,
        },
      });
      unlockedCount++;
    }

    // Remove tournament scorecard snapshot since not all groups are locked anymore
    await db.tournament.update({
      where: { id: tournamentId },
      data: { scorecardSnapshot: null },
    });

    return NextResponse.json({
      success: true,
      message: `Group ${groupLetter} unlocked (${unlockedCount} players)`,
      unlockedCount,
    });
  } catch (error) {
    console.error('Error unlocking group scores:', error);
    const message = error instanceof Error ? error.message : 'Failed to unlock scores';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
