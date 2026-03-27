import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Quick endpoint to make a specific user admin - GET request for easy browser access
export async function GET(request: NextRequest) {
  // Simple auth check - only allow with secret
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.DEBUG_SECRET && secret !== 'jazel-debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const email = 'kbelkhalfi@gmail.com';

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        email: email,
        message: 'This user does not exist in the database yet. They need to register first.'
      }, { status: 404 });
    }

    // Update user to admin
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        isAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User is now an admin!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin,
      },
    });
  } catch (error) {
    console.error('Make admin error:', error);
    return NextResponse.json({ error: 'Failed to update user', details: String(error) }, { status: 500 });
  }
}
