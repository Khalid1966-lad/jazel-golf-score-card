import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SUPER_ADMIN_EMAILS = ['kbelkhalfi@gmail.com', 'contact@jazelwebagency.com'];

const isSuperAdmin = (email: string | null) => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
};

// PUT /api/courses/[id]/holes - Update holes for a course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, email: true, isAdmin: true, blocked: true }
        }
      }
    });

    if (!session || session.expiresAt < new Date() || !session.user.isAdmin || session.user.blocked) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    
    // Check if the course exists and user has permission to edit it
    const existingCourse = await db.golfCourse.findUnique({
      where: { id },
      select: { adminId: true }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check permission: super admin can edit any, regular admin only assigned courses
    if (!isSuperAdmin(session.user.email) && existingCourse.adminId !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission to edit this course' }, { status: 403 });
    }

    const body = await request.json();
    const { holes } = body;
    
    // Update each hole
    for (const hole of holes) {
      await db.courseHole.update({
        where: { id: hole.id },
        data: {
          par: hole.par,
          handicap: hole.handicap,
          teeLatitude: hole.teeLatitude,
          teeLongitude: hole.teeLongitude,
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
