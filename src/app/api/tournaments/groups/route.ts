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

// PUT /api/tournaments/groups - Update group assignments or rename groups
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, assignments, action } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    // Handle group assignment
    if (Array.isArray(assignments)) {
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
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
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
      },
      orderBy: {
        user: {
          handicap: 'asc'  // Assign by handicap (lowest first)
        }
      }
    });

    if (participants.length === 0) {
      return NextResponse.json({ message: 'No unassigned participants', assigned: 0 });
    }

    // Get already assigned participants to find where to continue
    const assignedParticipants = await db.tournamentParticipant.findMany({
      where: { 
        tournamentId,
        groupLetter: { not: null }
      },
      orderBy: { groupLetter: 'asc' }
    });

    // Find the last used group letter and position
    let currentGroupLetter = 'A';
    let currentPosition = 1;
    
    if (assignedParticipants.length > 0) {
      // Find the highest group letter
      const groupLetters = assignedParticipants.map(p => p.groupLetter).filter(Boolean) as string[];
      const uniqueLetters = [...new Set(groupLetters)].sort();
      const lastLetter = uniqueLetters[uniqueLetters.length - 1];
      
      // Count participants in last group
      const lastGroupCount = assignedParticipants.filter(p => p.groupLetter === lastLetter).length;
      
      currentGroupLetter = lastLetter;
      currentPosition = lastGroupCount + 1;
      
      // If last group is full (4 players), start new group
      if (currentPosition > 4) {
        currentGroupLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1);
        currentPosition = 1;
      }
    }

    // Calculate tee times
    const startMinutes = startTime ? parseTimeToMinutes(startTime) : 480; // Default 8:00 AM
    const interval = intervalMinutes || 10;

    // Assign participants
    const results = [];
    for (const participant of participants) {
      // Calculate tee time for this group
      const groupIndex = currentGroupLetter.charCodeAt(0) - 'A'.charCodeAt(0);
      const teeTime = minutesToTime(startMinutes + groupIndex * interval);

      const updated = await db.tournamentParticipant.update({
        where: { id: participant.id },
        data: {
          groupLetter: currentGroupLetter,
          positionInGroup: currentPosition,
          teeTime: teeTime,
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

// DELETE /api/tournaments/groups - Remove a player from group OR delete entire group
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const userId = searchParams.get('userId');
    const groupLetter = searchParams.get('groupLetter');
    const deleteGroup = searchParams.get('deleteGroup') === 'true';

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    // Delete entire group
    if (deleteGroup && groupLetter) {
      // First, move all members of this group to unassigned
      await db.tournamentParticipant.updateMany({
        where: { 
          tournamentId,
          groupLetter: groupLetter
        },
        data: {
          groupLetter: null,
          positionInGroup: null,
          teeTime: null,
        }
      });

      // Now renumber the remaining groups to fill the gap
      // Get all remaining groups in order
      const remainingParticipants = await db.tournamentParticipant.findMany({
        where: { 
          tournamentId,
          groupLetter: { not: null }
        },
        orderBy: [{ groupLetter: 'asc' }, { positionInGroup: 'asc' }]
      });

      // Group by current group letter
      const groupMap = new Map<string, typeof remainingParticipants>();
      for (const p of remainingParticipants) {
        if (p.groupLetter) {
          if (!groupMap.has(p.groupLetter)) {
            groupMap.set(p.groupLetter, []);
          }
          groupMap.get(p.groupLetter)!.push(p);
        }
      }

      // Sort the group letters
      const sortedLetters = Array.from(groupMap.keys()).sort();

      // Reassign group letters starting from 'A'
      let newLetter = 'A';
      for (const oldLetter of sortedLetters) {
        if (oldLetter !== newLetter) {
          // Update all participants in this group to new letter
          for (const p of groupMap.get(oldLetter)!) {
            await db.tournamentParticipant.update({
              where: { id: p.id },
              data: { groupLetter: newLetter }
            });
          }
        }
        newLetter = String.fromCharCode(newLetter.charCodeAt(0) + 1);
      }

      return NextResponse.json({ 
        success: true, 
        message: `Group ${groupLetter} deleted and groups renumbered` 
      });
    }

    // Remove single player from group
    if (userId) {
      await db.tournamentParticipant.update({
        where: { tournamentId_userId: { tournamentId, userId } },
        data: {
          groupLetter: null,
          positionInGroup: null,
          teeTime: null,
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing userId or groupLetter' }, { status: 400 });
  } catch (error) {
    console.error('Error in DELETE groups:', error);
    return NextResponse.json({ error: 'Failed: ' + (error as Error).message }, { status: 500 });
  }
}

// PATCH /api/tournaments/groups - Update tee times for all groups and save tournament start time
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, startTime, intervalMinutes } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    // Update the tournament's start time
    if (startTime) {
      await db.tournament.update({
        where: { id: tournamentId },
        data: { startTime }
      });
    }

    // Get all assigned participants ordered by group and position
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

    if (participants.length === 0) {
      return NextResponse.json({ message: 'No assigned participants', updated: 0, startTimeSaved: !!startTime });
    }

    const startMinutes = startTime ? parseTimeToMinutes(startTime) : 480; // Default 8:00 AM
    const interval = intervalMinutes || 10;

    // Get unique group letters in order
    const groupLetters = [...new Set(participants.map(p => p.groupLetter))].filter(Boolean).sort() as string[];

    // Update tee times for each group
    let updated = 0;
    for (let i = 0; i < groupLetters.length; i++) {
      const letter = groupLetters[i];
      const groupParticipants = participants.filter(p => p.groupLetter === letter);
      const teeTime = minutesToTime(startMinutes + i * interval);

      for (const participant of groupParticipants) {
        await db.tournamentParticipant.update({
          where: { id: participant.id },
          data: { teeTime }
        });
        updated++;
      }
    }

    return NextResponse.json({ success: true, updated, groupsUpdated: groupLetters.length, startTimeSaved: !!startTime });
  } catch (error) {
    console.error('Error updating tee times:', error);
    return NextResponse.json({ error: 'Failed to update tee times: ' + (error as Error).message }, { status: 500 });
  }
}

// Helper: Parse "08:00" to minutes since midnight
function parseTimeToMinutes(time: string): number {
  if (!time) return 480;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

// Helper: Convert minutes to "08:00" format
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
