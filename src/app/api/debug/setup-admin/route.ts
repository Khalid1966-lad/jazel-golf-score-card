import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hash, compare } from 'bcryptjs';

// Setup superadmin and verify login works
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.DEBUG_SECRET && secret !== 'jazel-debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = 'kbelkhalfi@gmail.com';
  const password = 'Jazel2024!';
  const name = 'Khalid';

  try {
    console.log('Setup: Starting superadmin creation...');
    
    // Delete any existing user with this email
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      console.log('Setup: Deleting existing user...');
      await db.adminPermission.deleteMany({ where: { userId: existingUser.id } });
      await db.user.delete({ where: { id: existingUser.id } });
    }

    // Create fresh user with known password
    console.log('Setup: Creating new user...');
    const hashedPassword = await hash(password, 12);
    console.log('Setup: Password hashed, length:', hashedPassword.length);
    
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name,
        isAdmin: true,
        isSuperAdmin: true,
      },
    });
    console.log('Setup: User created with ID:', user.id);

    // Create admin permissions
    await db.adminPermission.create({
      data: {
        userId: user.id,
        canViewCourses: true,
        canViewUsers: true,
        canViewTournaments: true,
        canViewGroups: true,
        canViewMessages: true,
        canViewSettings: true,
        canViewBackup: true,
      },
    });
    console.log('Setup: Permissions created');

    // Verify password works
    console.log('Setup: Verifying password...');
    const verifyUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!verifyUser) {
      return NextResponse.json({ error: 'User not found after creation' }, { status: 500 });
    }

    const passwordWorks = await compare(password, verifyUser.password);
    console.log('Setup: Password verification result:', passwordWorks);

    // Count users
    const userCount = await db.user.count();

    return NextResponse.json({
      success: true,
      message: 'Superadmin created and verified',
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
      },
      verification: {
        passwordWorks: passwordWorks,
        hashedPasswordLength: hashedPassword.length,
      },
      database: {
        totalUsers: userCount,
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      error: 'Failed to setup superadmin',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
