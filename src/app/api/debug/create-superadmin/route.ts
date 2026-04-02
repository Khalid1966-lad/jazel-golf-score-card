import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

// Debug endpoint to create a superadmin user
export async function POST(request: NextRequest) {
  // Simple auth check - only allow with secret
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.DEBUG_SECRET && secret !== 'jazel-debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() || {};
    const email = body.email || 'kbelkhalfi@gmail.com';
    const password = body.password || 'Jazel2024!';
    const name = body.name || 'Khalid';

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const hashedPassword = await hash(password, 12);

    if (existingUser) {
      // Update existing user to superadmin
      const updatedUser = await db.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          isAdmin: true,
          isSuperAdmin: true,
          name: name,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User updated to superadmin with new password',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          isAdmin: updatedUser.isAdmin,
          isSuperAdmin: updatedUser.isSuperAdmin,
        },
        login: {
          email: email,
          password: password,
        }
      });
    }

    // Create new superadmin user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name,
        isAdmin: true,
        isSuperAdmin: true,
      },
    });

    // Create admin permissions
    await db.adminPermission.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        canViewCourses: true,
        canViewUsers: true,
        canViewTournaments: true,
        canViewGroups: true,
        canViewMessages: true,
        canViewSettings: true,
        canViewBackup: true,
      },
      update: {
        canViewCourses: true,
        canViewUsers: true,
        canViewTournaments: true,
        canViewGroups: true,
        canViewMessages: true,
        canViewSettings: true,
        canViewBackup: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Superadmin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
      },
      login: {
        email: email,
        password: password,
      }
    });
  } catch (error) {
    console.error('Create superadmin error:', error);
    return NextResponse.json({
      error: 'Failed to create superadmin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for easy browser access
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.DEBUG_SECRET && secret !== 'jazel-debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = request.nextUrl.searchParams.get('email') || 'kbelkhalfi@gmail.com';
  const password = request.nextUrl.searchParams.get('password') || 'Jazel2024!';
  const name = request.nextUrl.searchParams.get('name') || 'Khalid';

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const hashedPassword = await hash(password, 12);

    if (existingUser) {
      // Update existing user to superadmin
      const updatedUser = await db.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          isAdmin: true,
          isSuperAdmin: true,
          name: name,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User updated to superadmin with new password',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          isAdmin: updatedUser.isAdmin,
          isSuperAdmin: updatedUser.isSuperAdmin,
        },
        login: {
          email: email,
          password: password,
        }
      });
    }

    // Create new superadmin user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name,
        isAdmin: true,
        isSuperAdmin: true,
      },
    });

    // Create admin permissions
    await db.adminPermission.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        canViewCourses: true,
        canViewUsers: true,
        canViewTournaments: true,
        canViewGroups: true,
        canViewMessages: true,
        canViewSettings: true,
        canViewBackup: true,
      },
      update: {
        canViewCourses: true,
        canViewUsers: true,
        canViewTournaments: true,
        canViewGroups: true,
        canViewMessages: true,
        canViewSettings: true,
        canViewBackup: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Superadmin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
      },
      login: {
        email: email,
        password: password,
      }
    });
  } catch (error) {
    console.error('Create superadmin error:', error);
    return NextResponse.json({
      error: 'Failed to create superadmin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
