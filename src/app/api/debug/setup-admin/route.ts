import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

// Quick setup endpoint to create admin - GET request for easy browser access
export async function GET(request: NextRequest) {
  // Simple auth check - only allow with secret
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.DEBUG_SECRET && secret !== 'jazel-debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const email = 'contact@jazelwebagency.com';
    const password = '1234';
    const name = 'Admin';

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // Update existing user to admin and reset password
      const hashedPassword = await hash(password, 12);
      const updatedUser = await db.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          isAdmin: true,
          name: name,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Admin user updated successfully!',
        login: {
          email: email,
          password: password,
        },
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          isAdmin: updatedUser.isAdmin,
        },
      });
    }

    // Create new admin user
    const hashedPassword = await hash(password, 12);
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name,
        isAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully!',
      login: {
        email: email,
        password: password,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Failed to create admin user', details: String(error) }, { status: 500 });
  }
}
