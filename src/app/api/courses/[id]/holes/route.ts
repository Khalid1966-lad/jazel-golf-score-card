import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/courses/[id]/holes - Update holes for a course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { holes } = body;
    
    // Update each hole
    for (const hole of holes) {
      await db.courseHole.update({
        where: { id: hole.id },
        data: {
          par: hole.par,
          handicap: hole.handicap,
          greenLatitude: hole.greenLatitude,
          greenLongitude: hole.greenLongitude,
        },
      });
    }

    // Fetch updated course
    const course = await db.golfCourse.findUnique({
      where: { id },
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' },
        },
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error updating holes:', error);
    return NextResponse.json(
      { error: 'Failed to update holes' },
      { status: 500 }
    );
  }
}
