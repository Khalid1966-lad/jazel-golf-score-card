import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Super Admin emails - same as frontend
const SUPER_ADMIN_EMAILS = [
  'kbelkhalfi@gmail.com',
  'contact@jazelwebagency.com',
];

const isSuperAdminEmail = (email: string | null) => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
};

// Helper to verify admin authentication
async function verifyAdmin(request: NextRequest) {
  // Check for admin access via session_token (same as other admin APIs)
  const sessionToken = request.cookies.get('session_token')?.value;
  
  if (!sessionToken) {
    return null;
  }
  
  const session = await db.adminSession.findUnique({
    where: { token: sessionToken },
    include: { 
      user: {
        select: { id: true, email: true, isAdmin: true, isSuperAdmin: true }
      }
    }
  });
  
  if (!session || session.expiresAt < new Date() || !session.user.isAdmin) {
    if (session) {
      await db.adminSession.delete({ where: { token: sessionToken } });
    }
    return null;
  }
  
  // Check super admin - either by database field OR by email list
  const isSuper = session.user.isSuperAdmin || isSuperAdminEmail(session.user.email);
  return { ...session.user, isSuperAdmin: isSuper };
}

// Helper to check if admin has access to a course
async function checkCourseAccess(courseId: string, admin: { id: string; isSuperAdmin: boolean }) {
  const course = await db.golfCourse.findUnique({
    where: { id: courseId },
    select: { adminId: true }
  });
  
  if (!course) {
    return { hasAccess: false, reason: 'not_found' };
  }
  
  if (admin.isSuperAdmin || course.adminId === admin.id) {
    return { hasAccess: true };
  }
  
  return { hasAccess: false, reason: 'access_denied' };
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
    
    // Check access
    const access = await checkCourseAccess(id, admin);
    if (!access.hasAccess) {
      if (access.reason === 'not_found') {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const body = await request.json();
    const { holes } = body;

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
    
    // Check access
    const access = await checkCourseAccess(id, admin);
    if (!access.hasAccess) {
      if (access.reason === 'not_found') {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
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
    
    // Check access
    const access = await checkCourseAccess(id, admin);
    if (!access.hasAccess) {
      if (access.reason === 'not_found') {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
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
