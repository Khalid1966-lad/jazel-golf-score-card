import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tournaments/groups - Get all groups for a tournament
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    const participants = await db.tournamentParticipant.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            handicap: true,
            email: true,
          }
        }
      },
      orderBy: [
        { groupLetter: 'asc' },
        { positionInGroup: 'asc' }
      ]
    });

    // Group participants by groupLetter
    const groups: Record<string, typeof participants> = {};
    const unassigned: typeof participants = [];

    for (const participant of participants) {
      if (participant.groupLetter) {
        if (!groups[participant.groupLetter]) {
          groups[participant.groupLetter] = [];
        }
        groups[participant.groupLetter].push(participant);
      } else {
        unassigned.push(participant);
      }
    }

    return NextResponse.json({ groups, unassigned, participants });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// PUT /api/tournaments/groups - Update group assignments
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, assignments } = body;

    if (!tournamentId || !Array.isArray(assignments)) {
      return NextResponse.json({ error: 'Missing tournamentId or assignments' }, { status: 400 });
    }

    // Update each participant's group assignment
    const results = [];
    for (const assignment of assignments) {
      const { userId, groupLetter, positionInGroup, teeTime } = assignment;
      
      const participant = await db.tournamentParticipant.update({
        where: { tournamentId_userId: { tournamentId, userId } },
        data: {
          groupLetter: groupLetter ?? null,
          positionInGroup: positionInGroup ?? null,
          teeTime: teeTime ?? null,
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
      results.push(participant);
    }

    return NextResponse.json({ success: true, updated: results.length });
  } catch (error) {
    console.error('Error updating groups:', error);
    return NextResponse.json({ error: 'Failed to update groups: ' + (error as Error).message }, { status: 500 });
  }
}

// POST /api/tournaments/groups - Auto-assign participants to groups
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, startTime, intervalMinutes } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    // Get all participants without group assignment
    const participants = await db.tournamentParticipant.findMany({
      where: { 
        tournamentId,
        groupLetter: null 
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

    if (participants.length === 0) {
      return NextResponse.json({ message: 'No unassigned participants', groupsCreated: 0 });
    }

    // Also get already assigned participants to continue from existing groups
    const assignedParticipants = await db.tournamentParticipant.findMany({
      where: { 
        tournamentId,
        groupLetter: { not: null }
      },
      orderBy: { groupLetter: 'asc' }
    });

    // Find the last used group letter
    let lastGroupLetter = '@'; // Before 'A'
    for (const p of assignedParticipants) {
      if (p.groupLetter && p.groupLetter > lastGroupLetter) {
        lastGroupLetter = p.groupLetter;
      }
    }

    // Check if the last group has space
    const lastGroupParticipants = assignedParticipants.filter(p => p.groupLetter === lastGroupLetter);
    let currentGroupLetter = lastGroupLetter;
    let currentPosition = lastGroupParticipants.length + 1;
    
    // If last group is full, start new group
    if (currentPosition > 4) {
      currentGroupLetter = String.fromCharCode(lastGroupLetter.charCodeAt(0) + 1);
      currentPosition = 1;
    }

    // Calculate tee times
    const startMinutes = startTime ? parseTimeToMinutes(startTime) : 480; // Default 8:00 AM
    const interval = intervalMinutes || 10;
    let currentTeeTime = currentGroupLetter !== lastGroupLetter 
      ? startMinutes + (currentGroupLetter.charCodeAt(0) - 'A'.charCodeAt(0)) * interval
      : startMinutes + (currentGroupLetter.charCodeAt(0) - 'A'.charCodeAt(0)) * interval;

    // Assign participants
    const results = [];
    for (const participant of participants) {
      // Update participant
      const updated = await db.tournamentParticipant.update({
        where: { id: participant.id },
        data: {
          groupLetter: currentGroupLetter,
          positionInGroup: currentPosition,
          teeTime: minutesToTime(currentTeeTime),
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
      results.push(updated);

      // Move to next position
      currentPosition++;
      if (currentPosition > 4) {
        currentPosition = 1;
        currentGroupLetter = String.fromCharCode(currentGroupLetter.charCodeAt(0) + 1);
        currentTeeTime += interval;
      }
    }

    return NextResponse.json({ 
      success: true, 
      assigned: results.length,
      groupsCreated: new Set(results.map(r => r.groupLetter)).size
    });
  } catch (error) {
    console.error('Error auto-assigning groups:', error);
    return NextResponse.json({ error: 'Failed to auto-assign groups: ' + (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/tournaments/groups - Remove a player from a group OR delete entire group
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const userId = searchParams.get('userId');
    const groupLetter = searchParams.get('groupLetter');
    const renumber = searchParams.get('renumber') === 'true';

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    // If groupLetter is provided, delete the entire group
    if (groupLetter) {
      // Get all participants in this group to move them to unassigned
      const groupParticipants = await db.tournamentParticipant.findMany({
        where: { tournamentId, groupLetter }
      });

      // Move all participants to unassigned
      await db.tournamentParticipant.updateMany({
        where: { tournamentId, groupLetter },
        data: {
          groupLetter: null,
          positionInGroup: null,
          teeTime: null,
        }
      });

      // If renumber is requested, renumber all remaining groups
      if (renumber) {
        await renumberGroups(tournamentId);
      }

      return NextResponse.json({ 
        success: true, 
        movedCount: groupParticipants.length,
        message: `Group ${groupLetter} deleted. ${groupParticipants.length} participants moved to unassigned.`
      });
    }

    // Otherwise, remove single player from group
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId or groupLetter' }, { status: 400 });
    }

    const participant = await db.tournamentParticipant.update({
      where: { tournamentId_userId: { tournamentId, userId } },
      data: {
        groupLetter: null,
        positionInGroup: null,
        teeTime: null,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from group:', error);
    return NextResponse.json({ error: 'Failed to remove from group' }, { status: 500 });
  }
}

// PATCH /api/tournaments/groups - Assign or remove scorer for a group
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, groupLetter, scorerId } = body;

    if (!tournamentId || !groupLetter) {
      return NextResponse.json({ error: 'Missing tournamentId or groupLetter' }, { status: 400 });
    }

    // If scorerId is provided, set that user as the scorer (and clear others in same group)
    // If scorerId is null, clear the scorer for this group
    if (scorerId) {
      // Clear any existing scorer in this group
      await db.tournamentParticipant.updateMany({
        where: { tournamentId, groupLetter, isScorer: true },
        data: { isScorer: false },
      });

      // Set the new scorer
      const participant = await db.tournamentParticipant.update({
        where: { tournamentId_userId: { tournamentId, userId: scorerId } },
        data: { isScorer: true },
        include: {
          user: { select: { id: true, name: true, handicap: true, avatar: true } },
        },
      });

      return NextResponse.json({ success: true, scorer: participant });
    } else {
      // Clear scorer for this group
      await db.tournamentParticipant.updateMany({
        where: { tournamentId, groupLetter, isScorer: true },
        data: { isScorer: false },
      });

      return NextResponse.json({ success: true, message: 'Scorer cleared for this group' });
    }
  } catch (error) {
    console.error('Error assigning scorer:', error);
    return NextResponse.json({ error: 'Failed to assign scorer' }, { status: 500 });
  }
}

// Helper: Renumber all groups sequentially (A, B, C...) and recalculate tee times
async function renumberGroups(tournamentId: string) {
  // Get tournament start time and tee time interval
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { startTime: true, teeTimeInterval: true }
  });

  const startMinutes = tournament?.startTime 
    ? parseTimeToMinutes(tournament.startTime) 
    : 480; // Default 8:00 AM
  
  const interval = tournament?.teeTimeInterval || 10; // Default 10 minutes

  // Get all assigned participants ordered by group letter and position
  const participants = await db.tournamentParticipant.findMany({
    where: { 
      tournamentId,
      groupLetter: { not: null }
    },
    orderBy: [
      { groupLetter: 'asc' },
      { positionInGroup: 'asc' }
    ]
  });

  // Group by current group letter
  const groupMap = new Map<string, typeof participants>();
  for (const p of participants) {
    if (p.groupLetter) {
      if (!groupMap.has(p.groupLetter)) {
        groupMap.set(p.groupLetter, []);
      }
      groupMap.get(p.groupLetter)!.push(p);
    }
  }

  // Sort groups by their letter
  const sortedGroups = Array.from(groupMap.keys()).sort();

  // Renumber: map old letter to new letter
  let newLetter = 'A';
  for (const oldLetter of sortedGroups) {
    const groupParticipants = groupMap.get(oldLetter)!;
    
    // Calculate tee time for this group (each group starts interval minutes after previous)
    const groupIndex = newLetter.charCodeAt(0) - 'A'.charCodeAt(0);
    const teeTimeMinutes = startMinutes + groupIndex * interval;
    const teeTime = minutesToTime(teeTimeMinutes);

    // Update all participants in this group
    for (const p of groupParticipants) {
      await db.tournamentParticipant.update({
        where: { id: p.id },
        data: {
          groupLetter: newLetter,
          teeTime,
        }
      });
    }

    newLetter = String.fromCharCode(newLetter.charCodeAt(0) + 1);
  }
}

// Helper: Parse "08:00" to minutes since midnight
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper: Convert minutes to "08:00" format
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
