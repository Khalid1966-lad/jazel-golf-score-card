import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get user's favorite courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    const favorites = await db.favorite.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            holes: { orderBy: { holeNumber: 'asc' } },
            tees: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      favorites: favorites.map(f => f.course)
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST - Add a course to favorites
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId } = body;

    // Check if already favorited
    const existing = await db.favorite.findUnique({
      where: {
        userId_courseId: {
          userId: userId || 'demo-user',
          courseId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already favorited' });
    }

    await db.favorite.create({
      data: {
        userId: userId || 'demo-user',
        courseId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE - Remove a course from favorites
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    await db.favorite.delete({
      where: {
        userId_courseId: { userId, courseId }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
