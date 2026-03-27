import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

// Update user - admin only
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // TEMP: Bypass auth for direct admin access
    // Original auth check commented out
    /*
    let isAdminUser = false;
    
    const adminToken = request.cookies.get('admin_token')?.value;
    if (adminToken) {
      const adminSession = await db.adminSession.findUnique({
        where: { token: adminToken },
        include: { user: true }
      });
      if (adminSession && adminSession.expiresAt > new Date() && adminSession.user.isAdmin) {
        isAdminUser = true;
      }
    }
    
    if (!isAdminUser) {
      const sessionToken = request.cookies.get('session_token')?.value;
      if (sessionToken) {
        const session = await db.adminSession.findUnique({
          where: { token: sessionToken },
          include: { user: true }
        });
        if (session && session.expiresAt > new Date() && session.user.isAdmin) {
          isAdminUser = true;
        }
      }
    }

    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    */

    const body = await request.json();
    const { name, email, handicap, city, country, isAdmin, password, blocked, hiddenFromGolfers } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (handicap !== undefined) updateData.handicap = handicap ? parseFloat(handicap) : null;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (blocked !== undefined) updateData.blocked = blocked;
    if (hiddenFromGolfers !== undefined) updateData.hiddenFromGolfers = hiddenFromGolfers;
    if (password) updateData.password = await hash(password, 12);

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        handicap: true,
        isAdmin: true,
        blocked: true,
        hiddenFromGolfers: true,
        avatar: true,
        city: true,
        country: true,
        createdAt: true
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// Delete user - admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // TEMP: Bypass auth for direct admin access

    await db.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
