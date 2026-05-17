import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/tournaments/withdraw - Mark a player as withdrawn (WD)
// Admin action: preserves existing scores, marks remaining holes as WD
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

    // Verify participant exists
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
