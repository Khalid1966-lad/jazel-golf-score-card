import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/rounds/share - Toggle share status of a round
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { roundId, isShared } = body;

    if (!roundId) {
      return NextResponse.json(
        { error: 'Round ID is required' },
        { status: 400 }
      );
    }

    const round = await db.round.update({
      where: { id: roundId },
      data: { isShared: isShared ?? true },
    });

    return NextResponse.json(round);
  } catch (error) {
    console.error('Error updating round share status:', error);
    return NextResponse.json(
      { error: 'Failed to update round share status' },
      { status: 500 }
    );
  }
}
