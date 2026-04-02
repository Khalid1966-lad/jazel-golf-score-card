import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find session
    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await db.adminSession.delete({ where: { token } });
      }
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Check if user is blocked
    if (session.user.blocked) {
      return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
    }

    const body = await request.json();
    const { avatar } = body;

    if (!avatar) {
      return NextResponse.json({ error: 'No avatar provided' }, { status: 400 });
    }

    // Validate that it's a base64 image (data:image/...;base64,...)
    if (!avatar.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    // Check size (base64 string length) - max ~500KB after compression
    const maxSize = 700000; // ~500KB in base64 is around 700k chars
    if (avatar.length > maxSize) {
      return NextResponse.json({ error: 'Image too large. Please compress further.' }, { status: 400 });
    }

    // Update user avatar
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { avatar },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        handicap: updatedUser.handicap,
        isAdmin: updatedUser.isAdmin,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find session
    const session = await db.adminSession.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Remove avatar
    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: { avatar: null },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        handicap: updatedUser.handicap,
        isAdmin: updatedUser.isAdmin,
        avatar: null,
      },
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}
