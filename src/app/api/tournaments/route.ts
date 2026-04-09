import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all tournaments or a single tournament
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeParticipants = searchParams.get('includeParticipants') === 'true';
    const tournamentId = searchParams.get('id');

    if (tournamentId) {
      // Fetch single tournament with participants
      const tournament = await db.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              city: true,
              region: true,
              country: true,
              holes: { select: { holeNumber: true, par: true }, orderBy: { holeNumber: 'asc' } },
            }
          },
          admin: {
            select: {
              id: true,
              name: true,
            }
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  handicap: true,
                }
              }
            }
          },
          _count: {
            select: { participants: true }
          }
        }
      });

      if (!tournament) {
        return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
      }

      return NextResponse.json({ tournament });
    }

    // Fetch all tournaments - includes admin relation for contact info
    const tournaments = await db.tournament.findMany({
      include: {
        course: {
          select: {
            id: true,
            name: true,
            city: true,
            region: true,
            country: true,
          }
        },
        admin: {
          select: {
            id: true,
            name: true,
          }
        },
        participants: includeParticipants ? {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                handicap: true,
              }
            }
          }
        } : false,
        _count: {
          select: { participants: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
  }
}

// POST - Create a new tournament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, courseId, date, startTime, teeTimeInterval, format, maxPlayers, notes, adminId, adminPhone } = body;

    if (!name || !courseId || !date) {
      return NextResponse.json({ error: 'Name, course, and date are required' }, { status: 400 });
    }

    // Verify course exists
    const course = await db.golfCourse.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: 'Golf course not found' }, { status: 404 });
    }

    // Verify admin exists if adminId is provided
    if (adminId) {
      const admin = await db.user.findUnique({
        where: { id: adminId }
      });
      if (!admin) {
        return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
      }
    }

    const tournament = await db.tournament.create({
      data: {
        name,
        courseId,
        date: new Date(date),
        startTime: startTime || '08:00',
        teeTimeInterval: teeTimeInterval || 10,
        format: format || 'Stroke Play',
        maxPlayers: maxPlayers || 144,
        notes: notes || null,
        adminId: adminId || null,
        adminPhone: adminPhone || null,
        status: 'upcoming',
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            city: true,
          }
        },
        admin: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}

// PUT - Update a tournament
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('id');

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, courseId, date, startTime, teeTimeInterval, format, maxPlayers, notes, status, adminId, adminPhone } = body;

    // Verify tournament exists
    const existingTournament = await db.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!existingTournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // If courseId is provided, verify it exists
    if (courseId) {
      const course = await db.golfCourse.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return NextResponse.json({ error: 'Golf course not found' }, { status: 404 });
      }
    }

    // Verify admin exists if adminId is provided
    if (adminId) {
      const admin = await db.user.findUnique({
        where: { id: adminId }
      });
      if (!admin) {
        return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (courseId !== undefined) updateData.courseId = courseId;
    if (date !== undefined) updateData.date = new Date(date);
    if (startTime !== undefined) updateData.startTime = startTime;
    if (teeTimeInterval !== undefined) updateData.teeTimeInterval = teeTimeInterval;
    if (format !== undefined) updateData.format = format;
    if (maxPlayers !== undefined) updateData.maxPlayers = maxPlayers;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (adminId !== undefined) updateData.adminId = adminId || null;
    if (adminPhone !== undefined) updateData.adminPhone = adminPhone || null;

    const tournament = await db.tournament.update({
      where: { id: tournamentId },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            city: true,
          }
        },
        admin: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: { participants: true }
        }
      }
    });

    return NextResponse.json({ tournament });
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 });
  }
}

// DELETE - Delete a tournament
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('id');

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    // Verify tournament exists
    const existingTournament = await db.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!existingTournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Delete all participants first (cascade should handle this, but let's be explicit)
    await db.tournamentParticipant.deleteMany({
      where: { tournamentId }
    });

    // Delete the tournament
    await db.tournament.delete({
      where: { id: tournamentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
  }
}
