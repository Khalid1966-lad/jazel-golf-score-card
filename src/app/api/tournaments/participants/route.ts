import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to award tournament achievements inline
async function awardTournamentAchievements(userId: string, tournamentCount: number) {
  try {
    const awardAchievement = async (code: string) => {
      const achievement = await db.achievement.findUnique({ where: { code } });
      if (!achievement) return;
      
      const existing = await db.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: achievement.id } }
      });
      if (existing) return;
      
      await db.userAchievement.create({
        data: { userId, achievementId: achievement.id }
      });
    };
    
    if (tournamentCount >= 1) await awardAchievement('first_tournament');
    if (tournamentCount >= 3) await awardAchievement('tournaments_3');
    if (tournamentCount >= 5) await awardAchievement('tournaments_5');
  } catch (err) {
    console.error('Error awarding tournament achievements:', err);
  }
}

// POST add a participant to a tournament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, userId, grossScore, netScore } = body;

    console.log('Adding participant:', { tournamentId, userId, grossScore, netScore });

    if (!tournamentId || !userId) {
      console.log('Missing required fields:', { tournamentId, userId });
      return NextResponse.json({ error: 'Missing tournamentId or userId' }, { status: 400 });
    }

    // Check if tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
    });

    if (!tournament) {
      console.log('Tournament not found:', tournamentId);
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log('User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is hidden
    if (user.hiddenFromGolfers) {
      console.log('User is hidden:', userId);
      return NextResponse.json({ error: 'User is hidden from golfers list' }, { status: 400 });
    }

    // Check if already registered
    const existing = await db.tournamentParticipant.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
    });

    if (existing) {
      console.log('Already registered:', { tournamentId, userId });
      return NextResponse.json({ error: 'Already registered for this tournament' }, { status: 400 });
    }

    // Check if tournament is full
    if (tournament.participants.length >= tournament.maxPlayers) {
      console.log('Tournament is full:', tournamentId);
      return NextResponse.json({ error: 'Tournament is full' }, { status: 400 });
    }

    const participant = await db.tournamentParticipant.create({
      data: {
        tournamentId,
        userId,
        grossScore: grossScore ?? null,
        netScore: netScore ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            handicap: true,
          }
        }
      }
    });

    // Check and award tournament achievements (non-blocking)
    const tournamentCount = await db.tournamentParticipant.count({ where: { userId } });
    awardTournamentAchievements(userId, tournamentCount)
      .catch(err => console.error('Error checking tournament achievements:', err));

    console.log('Participant added successfully:', participant);
    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ error: 'Failed to add participant: ' + (error as Error).message }, { status: 500 });
  }
}

// PUT update participant scores
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, userId, grossScore, netScore } = body;

    if (!tournamentId || !userId) {
      return NextResponse.json({ error: 'Missing tournamentId and userId' }, { status: 400 });
    }

    const participant = await db.tournamentParticipant.update({
      where: { tournamentId_userId: { tournamentId, userId } },
      data: {
        grossScore: grossScore ?? null,
        netScore: netScore ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            handicap: true,
          }
        }
      }
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 });
  }
}

// DELETE remove a participant from a tournament
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const userId = searchParams.get('userId');

    if (!tournamentId || !userId) {
      return NextResponse.json({ error: 'Missing tournamentId and userId' }, { status: 400 });
    }

    await db.tournamentParticipant.delete({
      where: { tournamentId_userId: { tournamentId, userId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 });
  }
}
