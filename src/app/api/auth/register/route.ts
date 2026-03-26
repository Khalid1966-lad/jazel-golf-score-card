import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { isSuperAdminEmail } from '@/lib/super-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, handicap, city, country } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Check if this email should be a super admin
    const shouldBeAdmin = isSuperAdminEmail(normalizedEmail);

    // Create user
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name || null,
        handicap: handicap ? parseFloat(handicap) : null,
        city: city || null,
        country: country || 'Morocco',
        isAdmin: shouldBeAdmin, // Auto-grant admin for super admin emails
      },
    });

    // Return user without password
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        handicap: user.handicap,
        city: user.city,
        country: user.country,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
