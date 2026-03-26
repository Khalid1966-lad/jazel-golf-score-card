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

// GET - List all courses with holes
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const courses = await db.golfCourse.findMany({
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' }
        },
        tees: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST - Create new course
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { name, city, region, country, latitude, longitude, totalHoles, description, designer, yearBuilt, phone, website, address, holes } = body;

    const course = await db.golfCourse.create({
      data: {
        name,
        city,
        region,
        country: country || 'Morocco',
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        totalHoles: parseInt(totalHoles) || 18,
        description,
        designer,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
        phone,
        website,
        address,
        holes: {
          create: holes || []
        }
      },
      include: {
        holes: true
      }
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
