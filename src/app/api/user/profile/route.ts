import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash, compare } from 'bcryptjs';
import { cookies } from 'next/headers';

// Get current user profile
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        handicap: session.user.handicap,
        avatar: session.user.avatar,
        city: session.user.city,
        country: session.user.country,
        nearbyDistance: session.user.nearbyDistance,
        distanceUnit: session.user.distanceUnit,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, handicap, city, country, currentPassword, newPassword, nearbyDistance, distanceUnit } = body;

    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (handicap !== undefined) updateData.handicap = handicap ? parseFloat(handicap) : null;
    if (city !== undefined) updateData.city = city || null;
    if (country !== undefined) updateData.country = country || 'Morocco';
    if (nearbyDistance !== undefined) updateData.nearbyDistance = parseInt(nearbyDistance) || 100;
    if (distanceUnit !== undefined) updateData.distanceUnit = distanceUnit === 'meters' ? 'meters' : 'yards';
    
    // Handle email change
    if (email && email !== session.user.email) {
      const existingUser = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      updateData.email = email.toLowerCase();
    }
    
    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password required to change password' }, { status: 400 });
      }
      
      const passwordMatch = await compare(currentPassword, session.user.password);
      if (!passwordMatch) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      
      updateData.password = await hash(newPassword, 12);
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        handicap: true,
        avatar: true,
        city: true,
        country: true,
        isAdmin: true,
        nearbyDistance: true,
        distanceUnit: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
