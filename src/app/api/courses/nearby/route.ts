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

// GET /api/courses/nearby - Find courses within radius of user's location
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radius = searchParams.get('radius') || '50'; // Default 50km

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const userLat = parseFloat(lat);
    const userLon = parseFloat(lon);
    const maxDistance = parseFloat(radius);

    const allCourses = await db.golfCourse.findMany({
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' },
        },
        tees: true,
      },
    });

    // Calculate distances and sort by proximity
    const coursesWithDistance = allCourses
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

    return NextResponse.json({
      courses: coursesWithDistance,
      userLocation: { lat: userLat, lon: userLon },
      radius: maxDistance,
    });
  } catch (error) {
    console.error('Error finding nearby courses:', error);
    return NextResponse.json(
      { error: 'Failed to find nearby courses' },
      { status: 500 }
    );
  }
}
