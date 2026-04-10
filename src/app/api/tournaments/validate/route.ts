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
