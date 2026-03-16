import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to verify admin authentication
async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  
  if (!token) {
    return null;
  }
  
  const session = await db.adminSession.findUnique({
    where: { token },
    include: { 
      user: {
        select: { id: true, email: true, isAdmin: true }
      }
    }
  });
  
  if (!session || session.expiresAt < new Date() || !session.user.isAdmin) {
    if (session) {
      await db.adminSession.delete({ where: { token } });
    }
    return null;
  }
  
  return session.user;
}

// PUT - Update holes for a course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { holes } = body;

    // Verify course exists
    const course = await db.golfCourse.findUnique({
      where: { id }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Update each hole
    const updatePromises = holes.map((hole: { id: string; par: number; handicap: number }) =>
      db.courseHole.update({
        where: { id: hole.id },
        data: {
          par: hole.par,
          handicap: hole.handicap
        }
      })
    );

    await Promise.all(updatePromises);

    // Return updated course with holes
    const updatedCourse = await db.golfCourse.findUnique({
      where: { id },
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Error updating holes:', error);
    return NextResponse.json({ error: 'Failed to update holes' }, { status: 500 });
  }
}

// POST - Add new hole to course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { holeNumber, par, handicap } = body;

    const hole = await db.courseHole.create({
      data: {
        courseId: id,
        holeNumber: parseInt(holeNumber),
        par: parseInt(par) || 4,
        handicap: parseInt(handicap) || 1
      }
    });

    // Update total holes count
    const holeCount = await db.courseHole.count({
      where: { courseId: id }
    });
    
    await db.golfCourse.update({
      where: { id },
      data: { totalHoles: holeCount }
    });

    return NextResponse.json(hole);
  } catch (error) {
    console.error('Error creating hole:', error);
    return NextResponse.json({ error: 'Failed to create hole' }, { status: 500 });
  }
}

// DELETE - Delete a hole
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const holeId = searchParams.get('holeId');

    if (!holeId) {
      return NextResponse.json({ error: 'Hole ID required' }, { status: 400 });
    }

    await db.courseHole.delete({
      where: { id: holeId }
    });

    // Update total holes count
    const holeCount = await db.courseHole.count({
      where: { courseId: id }
    });
    
    await db.golfCourse.update({
      where: { id },
      data: { totalHoles: holeCount }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hole:', error);
    return NextResponse.json({ error: 'Failed to delete hole' }, { status: 500 });
  }
}
