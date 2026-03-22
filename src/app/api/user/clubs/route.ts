import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Standard golf clubs list
const GOLF_CLUBS = [
  'Driver',
  '3-Wood',
  '5-Wood',
  '7-Wood',
  '2-Hybrid',
  '3-Hybrid',
  '4-Hybrid',
  '5-Hybrid',
  '2-Iron',
  '3-Iron',
  '4-Iron',
  '5-Iron',
  '6-Iron',
  '7-Iron',
  '8-Iron',
  '9-Iron',
  'Pitching Wedge',
  'Gap Wedge',
  'Sand Wedge',
  'Lob Wedge',
  'Putter',
];

// GET - Fetch user's clubs
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const clubs = await db.userClub.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });

    // Ensure all clubs have sortOrder
    const clubsSorted = clubs.map((club, index) => ({
      ...club,
      sortOrder: club.sortOrder ?? index,
    }));

    return NextResponse.json({ clubs: clubsSorted });
  } catch (error) {
    console.error('Error fetching user clubs:', error);
    return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 });
  }
}

// POST - Add or update a club
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, clubName, estimatedDistance, sortOrder } = body;

    if (!userId || !clubName) {
      return NextResponse.json({ error: 'User ID and club name are required' }, { status: 400 });
    }

    // Check if user already has 14 clubs (and this is a new club)
    const existingClubs = await db.userClub.count({
      where: { userId },
    });

    const existingClub = await db.userClub.findUnique({
      where: { userId_clubName: { userId, clubName } },
    });

    if (!existingClub && existingClubs >= 14) {
      return NextResponse.json({ error: 'Maximum 14 clubs allowed in the bag' }, { status: 400 });
    }

    // Validate club name
    if (!GOLF_CLUBS.includes(clubName)) {
      return NextResponse.json({ error: 'Invalid club name' }, { status: 400 });
    }

    // Determine the sort order
    const finalSortOrder = sortOrder ?? existingClub?.sortOrder ?? existingClubs;

    const club = await db.userClub.upsert({
      where: { userId_clubName: { userId, clubName } },
      update: {
        estimatedDistance: estimatedDistance ?? null,
        sortOrder: finalSortOrder,
      },
      create: {
        userId,
        clubName,
        estimatedDistance: estimatedDistance ?? null,
        sortOrder: finalSortOrder,
      },
    });

    return NextResponse.json({ club });
  } catch (error) {
    console.error('Error saving club:', error);
    return NextResponse.json({ error: 'Failed to save club' }, { status: 500 });
  }
}

// DELETE - Remove a club
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const clubName = request.nextUrl.searchParams.get('clubName');

    if (!userId || !clubName) {
      return NextResponse.json({ error: 'User ID and club name are required' }, { status: 400 });
    }

    await db.userClub.delete({
      where: { userId_clubName: { userId, clubName } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting club:', error);
    return NextResponse.json({ error: 'Failed to delete club' }, { status: 500 });
  }
}

// Export the club list for frontend use
export { GOLF_CLUBS };
