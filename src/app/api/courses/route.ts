import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Haversine formula to calculate distance between two points in kilometers
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// GET /api/courses - Get all courses or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radius = searchParams.get('radius'); // in km

    let courses = await db.golfCourse.findMany({
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' },
        },
        tees: true,
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    });

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(
        (course) =>
          course.name.toLowerCase().includes(searchLower) ||
          course.city.toLowerCase().includes(searchLower) ||
          course.region.toLowerCase().includes(searchLower)
      );
    }

    // Filter by city
    if (city) {
      const cityLower = city.toLowerCase();
      courses = courses.filter((course) =>
        course.city.toLowerCase().includes(cityLower)
      );
    }

    // Calculate distances and filter by radius if location provided
    if (lat && lon) {
      const userLat = parseFloat(lat);
      const userLon = parseFloat(lon);
      const maxDistance = radius ? parseFloat(radius) : 100; // Default 100km

      courses = courses
        .map((course) => ({
          ...course,
          distance: calculateDistance(
            userLat,
            userLon,
            course.latitude,
            course.longitude
          ),
        }))
        .filter((course) => course.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);
    }

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { holes, ...courseData } = body;

    const course = await db.golfCourse.create({
      data: {
        name: courseData.name,
        city: courseData.city,
        region: courseData.region || '',
        country: courseData.country || 'Morocco',
        latitude: courseData.latitude || 0,
        longitude: courseData.longitude || 0,
        totalHoles: courseData.totalHoles || 18,
        description: courseData.description,
        designer: courseData.designer,
        yearBuilt: courseData.yearBuilt,
        phone: courseData.phone,
        website: courseData.website,
        address: courseData.address,
        isActive: courseData.isActive ?? true,
        holes: {
          create: holes?.map((h: { holeNumber: number; par: number; handicap: number }) => ({
            holeNumber: h.holeNumber,
            par: h.par,
            handicap: h.handicap,
          })) || [],
        },
      },
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' },
        },
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
