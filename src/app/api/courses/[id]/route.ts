import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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
    const { id } = await params;
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
    const { id } = await params;
    
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
