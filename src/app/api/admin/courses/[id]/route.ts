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

// GET - Get single course with holes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    const course = await db.golfCourse.findUnique({
      where: { id },
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' }
        },
        tees: true,
        assignedAdmin: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if admin has access to this course
    if (!admin.isSuperAdmin && course.adminId !== admin.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

// PUT - Update course
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
    
    // Check if admin has access to this course
    const existingCourse = await db.golfCourse.findUnique({
      where: { id },
      select: { adminId: true }
    });
    
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    if (!admin.isSuperAdmin && existingCourse.adminId !== admin.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const body = await request.json();
    const { name, city, region, country, latitude, longitude, totalHoles, description, designer, yearBuilt, phone, website, address, adminId: newAdminId } = body;

    const course = await db.golfCourse.update({
      where: { id },
      data: {
        name,
        city,
        region,
        country,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        totalHoles: parseInt(totalHoles) || 18,
        description,
        designer,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
        phone,
        website,
        address,
        // Only super admins can reassign courses
        ...(admin.isSuperAdmin && newAdminId !== undefined && { adminId: newAdminId || null })
      }
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

// DELETE - Delete course
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
    
    // Check if admin has access to this course
    const existingCourse = await db.golfCourse.findUnique({
      where: { id },
      select: { adminId: true }
    });
    
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    if (!admin.isSuperAdmin && existingCourse.adminId !== admin.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Get all tee IDs for this course
    const tees = await db.courseTee.findMany({
      where: { courseId: id },
      select: { id: true }
    });
    const teeIds = tees.map(t => t.id);
    
    // Delete related records first
    if (teeIds.length > 0) {
      await db.courseHoleDistance.deleteMany({
        where: { teeId: { in: teeIds } }
      });
    }
    await db.courseTee.deleteMany({
      where: { courseId: id }
    });
    await db.courseHole.deleteMany({
      where: { courseId: id }
    });
    
    // Delete the course
    await db.golfCourse.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
