import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SUPER_ADMIN_EMAILS = ['kbelkhalfi@gmail.com', 'contact@jazelwebagency.com'];

const isSuperAdmin = (email: string | null) => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
};

// GET /api/courses/[id] - Get a specific course with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const course = await db.golfCourse.findUnique({
      where: { id },
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' },
          include: {
            teeDistances: {
              include: {
                tee: true,
              },
            },
          },
        },
        tees: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update a course
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
    
    const course = await db.golfCourse.update({
      where: { id },
      data: {
        name: body.name,
        city: body.city,
        region: body.region,
        country: body.country,
        latitude: body.latitude,
        longitude: body.longitude,
        totalHoles: body.totalHoles,
        description: body.description,
        designer: body.designer,
        yearBuilt: body.yearBuilt,
        phone: body.phone,
        website: body.website,
        address: body.address,
        isActive: body.isActive,
        adminId: body.adminId,
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete a course
export async function DELETE(
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
    
    // Check if the course exists and user has permission to delete it
    const existingCourse = await db.golfCourse.findUnique({
      where: { id },
      select: { adminId: true }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check permission: super admin can delete any, regular admin only assigned courses
    if (!isSuperAdmin(session.user.email) && existingCourse.adminId !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission to delete this course' }, { status: 403 });
    }
    
    await db.golfCourse.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
